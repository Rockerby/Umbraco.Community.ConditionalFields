import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { PropertyConditionalConfiguration, DependencyInfo } from './types.js';
import { ConditionalEvaluator } from './conditional-evaluator.service.js';
import { ConditionalFieldsService } from '../api/index.js';

export const UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT = new UmbContextToken<UmbDocumentConditionalWorkspaceContext>(
	'UmbDocumentConditionalWorkspaceContext',
	'CndFlds.WorkspaceContext.Document.Conditional'
);

/**
 * Workspace context for managing conditional field visibility in document editing
 * This context loads configurations, observes property values, and applies visibility rules
 */
export class UmbDocumentConditionalWorkspaceContext extends UmbContextBase {
	#documentContext?: typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE;

	// Map of property type key to configuration
	#configurations = new Map<string, PropertyConditionalConfiguration>();

	// Map of property alias to property type key (for quick lookup)
	#aliasToKeyMap = new Map<string, string>();

	// Map of property alias to property name (for dependency info)
	#aliasToNameMap = new Map<string, string>();

	// Reverse dependency map: property key -> array of property keys that depend on it
	#reverseDependencies = new Map<string, Set<string>>();

	// Current document type key
	#documentTypeKey?: string;

	constructor(host: UmbControllerHost) {
		super(host, UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT);

		this.#init();
	}

	async #init() {
		console.log("[ConditionalFields] Initializing workspace context");

		// Consume the document workspace context first
		this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, async (context) => {
			console.log("[ConditionalFields] Document workspace context consumed");
			this.#documentContext = context;

			// Get the content type ID and initialize
			const initializeContext = async () => {
				const contentTypeId = context?.getContentTypeUnique();

				if (contentTypeId) {
					console.log("[ConditionalFields] Init - contentTypeId", contentTypeId);
					this.#documentTypeKey = contentTypeId;
					await this.#setupPropertyMappings();
					await this.#loadConfigurations();

					// Setup observers using the document workspace context directly
					await this.#setupPropertyObservers();
					await this.#performInitialEvaluation();
				}
			};

			// Initialize immediately
			await initializeContext();

			// Also observe the data to detect property changes
			this.observe(
				context?.data,
				() => {
					console.log("[ConditionalFields] Data changed");
					// Re-evaluate all conditional properties
					this.#onAnyPropertyChanged();
				},
				'observeData'
			);

			// Also observe unique to re-initialize when document changes
			this.observe(
				context?.contentTypeUnique,
				() => {
					console.log("[ConditionalFields] Document type changed, re-initializing");
					initializeContext();
				},
				'observeDocumentUnique'
			);
		});
	}

	/**
	 * Called when any property value changes
	 * Re-evaluates all conditional properties
	 */
	#onAnyPropertyChanged() {
		console.log("[ConditionalFields] Property value changed, re-evaluating all conditionals");
		for (const [propertyKey, config] of this.#configurations) {
			if (config.isConditional) {
				this.#evaluateAndApplyVisibility(propertyKey);
			}
		}
	}

	/**
	 * Load all conditional configurations for the current document type
	 */
	async #loadConfigurations() {
		if (!this.#documentTypeKey) {
			console.warn('[ConditionalFields] No document type key available');
			return;
		}

		try {
			const { data, error } = await ConditionalFieldsService.getAllConfigurations();

			if (error) {
				console.warn('[ConditionalFields] Failed to load configurations:', error);
				return;
			}
			
			console.log("this.#configurations", { data, error });
			
			if (!data) {
				return;
			}

			// Clear existing configurations
			this.#configurations.clear();
			this.#reverseDependencies.clear();

			// Store configurations
			for (const [propertyKey, config] of Object.entries(data)) {
				if (config && typeof config === 'object') {
					this.#configurations.set(propertyKey, config as PropertyConditionalConfiguration);
				}
			}
console.log("Built config, not doingbuilde reserve", this.#configurations);
			// Build reverse dependency map
			this.#buildReverseDependencyMap();
		} catch (error) {
			console.error('[ConditionalFields] Error loading configurations:', error);
		}
	}

	/**
	 * Setup mappings between property aliases, keys, and names
	 */
	async #setupPropertyMappings() {
		if (!this.#documentContext) {
			console.warn('[ConditionalFields] Document context not available');
			return;
		}

		try {
			// Get all properties from the document type structure
			const allProperties = await this.#documentContext.structure?.getContentTypeProperties();

			if (!allProperties) {
				console.warn('[ConditionalFields] No properties available');
				return;
			}

			// Clear existing mappings
			this.#aliasToKeyMap.clear();
			this.#aliasToNameMap.clear();

			// Build mappings
			for (const prop of allProperties) {
				if (prop.alias && prop.unique) {
					this.#aliasToKeyMap.set(prop.alias, prop.unique);
					this.#aliasToNameMap.set(prop.alias, prop.name ?? prop.alias);
				}
			}
		} catch (error) {
			console.error('[ConditionalFields] Error setting up property mappings:', error);
		}
	}

	/**
	 * Build reverse dependency map to know which properties depend on each property
	 */
	#buildReverseDependencyMap() {
		this.#reverseDependencies.clear();

		for (const [propertyKey, config] of this.#configurations) {
			if (!config.isConditional || !config.rules) {
				continue;
			}

			// Get all fields this property depends on
			const referencedFields = ConditionalEvaluator.getReferencedFields(config.rules);

			for (const fieldAlias of referencedFields) {
				const dependencyKey = this.#aliasToKeyMap.get(fieldAlias);
				if (dependencyKey) {
					if (!this.#reverseDependencies.has(dependencyKey)) {
						this.#reverseDependencies.set(dependencyKey, new Set());
					}
					this.#reverseDependencies.get(dependencyKey)!.add(propertyKey);
				}
			}
		}

		console.log('Reverse Dependency Map:', this.#reverseDependencies);
	}

	/**
	 * Setup observers for all properties referenced in conditional rules
	 * Note: We're now using variant data observer instead of individual property observers
	 */
	async #setupPropertyObservers() {
		console.log("[ConditionalFields] Property observers setup (using variant data observer)");
		// The actual observation is now done via context.currentVariant.data in #init
		// This method is kept for compatibility but doesn't set up individual observers anymore
	}


	/**
	 * Perform initial evaluation for all conditional properties
	 * Called after observers are setup
	 */
	async #performInitialEvaluation() {
		console.log("[ConditionalFields] Performing initial evaluation of conditional properties");

		// Wait for the UI to be fully rendered using MutationObserver
		await this.#waitForUIRender();

		for (const [propertyKey, config] of this.#configurations) {
			console.log("Initial eval for", {propertyKey, config});
			if (config.isConditional) {
				this.#evaluateAndApplyVisibility(propertyKey);
			}
		}
	}

	/**
	 * Wait for the UI to be rendered by watching for property elements in the DOM
	 * Uses MutationObserver to detect when content is added
	 */
	async #waitForUIRender(): Promise<void> {
		return new Promise((resolve) => {
			console.log("[ConditionalFields] Waiting for UI to render...");

			// First, try to find any umb-property element
			const checkForProperties = () => {
				const findInShadowDOM = (root: Document | ShadowRoot | Element): Element | null => {
					const property = root.querySelector('umb-property');
					if (property) return property;

					const elements = root.querySelectorAll('*');
					for (const el of elements) {
						if (el.shadowRoot) {
							const found = findInShadowDOM(el.shadowRoot);
							if (found) return found;
						}
					}
					return null;
				};
				const docRoot = document.querySelector('umb-app')!;
				if (docRoot) return null;
				return findInShadowDOM(docRoot);
			};

			// Check if properties already exist
			if (checkForProperties()) {
				console.log("[ConditionalFields] Properties already rendered");
				// Give it a small additional delay for all properties to settle
				setTimeout(() => resolve(), 100);
				return;
			}

			// Set up MutationObserver to watch for when properties are added
			let timeoutId: number;
			const observer = new MutationObserver(() => {
				if (checkForProperties()) {
					console.log("[ConditionalFields] Properties detected via MutationObserver");
					observer.disconnect();
					clearTimeout(timeoutId);
					// Give it a small additional delay for all properties to settle
					setTimeout(() => resolve(), 100);
				}
			});

			// Observe the entire document for changes
			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});

			// Fallback timeout after 5 seconds
			timeoutId = window.setTimeout(() => {
				console.warn("[ConditionalFields] UI render timeout - proceeding anyway");
				observer.disconnect();
				resolve();
			}, 200);
		});
	}

	/**
	 * Evaluate rules for a property and apply visibility
	 */
	async #evaluateAndApplyVisibility(propertyKey: string) {
		const config = this.#configurations.get(propertyKey);
		console.log("Evaluating visibility for", {propertyKey, config});
		if (!config || !config.isConditional) {
			return;
		}

		// Get the property alias from the key
		let propertyAlias: string | undefined;
		for (const [alias, key] of this.#aliasToKeyMap) {
			if (key === propertyKey) {
				propertyAlias = alias;
				break;
			}
		}

		if (!propertyAlias) {
			console.warn('[ConditionalFields] Could not find alias for property key:', propertyKey);
			return;
		}

		// Collect current values for all referenced fields
		const values = new Map<string, any>();
		const referencedFields = ConditionalEvaluator.getReferencedFields(config.rules);

		// Get property values from the document workspace data
		const documentData = this.#documentContext?.getData();

		for (const fieldAlias of referencedFields) {
			try {
				// Get the value from the document data using the property alias
				const propertyValue = documentData?.values?.find((v: any) => v.alias === fieldAlias)?.value;
				values.set(fieldAlias, propertyValue);
				console.log(`[ConditionalFields] Got value for ${fieldAlias}:`, propertyValue);
			} catch (error) {
				console.warn(`[ConditionalFields] Could not get value for ${fieldAlias}:`, error);
				values.set(fieldAlias, undefined);
			}
		}

		// Evaluate the rules
		const shouldBeVisible = ConditionalEvaluator.evaluateRules(config.rules, values);

		// Apply visibility to DOM
		this.#applyVisibilityToDOM(propertyAlias, shouldBeVisible);
	}

	/**
	 * Apply visibility to a property element in the DOM
	 * Includes retry logic if element not found immediately
	 */
	#applyVisibilityToDOM(propertyAlias: string, visible: boolean, retryCount = 0) {
		console.log(`[ConditionalFields] Applying visibility to ${propertyAlias}: ${visible} (attempt ${retryCount + 1})`);

		// Helper function to search through shadow DOM recursively
		const findPropertyElement = (root: Document | ShadowRoot | Element): Element | null => {
			// Try to find the property directly
			const selectors = [
				`umb-property[alias="${propertyAlias}"]`,
				`umb-property[property-alias="${propertyAlias}"]`,
				`[data-property-alias="${propertyAlias}"]`,
				`[alias="${propertyAlias}"]`,
			];

			for (const selector of selectors) {
				const element = root.querySelector(selector);
				if (element) {
					console.log(`[ConditionalFields] Found property element using selector: ${selector}`);
					return element;
				}
			}

			// If not found, traverse into shadow roots
			const allElements = root.querySelectorAll('*');
			for (const element of allElements) {
				if (element.shadowRoot) {
					const found = findPropertyElement(element.shadowRoot);
					if (found) {
						return found;
					}
				}
			}

			return null;
		};

		// Start searching from the document root
		const propertyElement = findPropertyElement(document);

		if (!propertyElement) {
			// If not found and we haven't retried too many times, try again after a delay
			if (retryCount < 5) {
				const delay = 200 * (retryCount + 1); // Exponential backoff: 200ms, 400ms, 600ms, etc.
				console.warn(`[ConditionalFields] Property element not found for: ${propertyAlias}, retrying in ${delay}ms...`);
				setTimeout(() => {
					this.#applyVisibilityToDOM(propertyAlias, visible, retryCount + 1);
				}, delay);
			} else {
				console.error(`[ConditionalFields] Could not find property element for: ${propertyAlias} after ${retryCount} retries`);
			}
			return;
		}

		// Apply visibility
		(propertyElement as HTMLElement).style.display = visible ? '' : 'none';
		console.log(`[ConditionalFields] Successfully applied visibility to ${propertyAlias}`);
	}

	/**
	 * Get dependency information for a property (for settings UI)
	 * Returns list of properties that depend on the given property
	 */
	public getDependenciesFor(propertyKey: string): DependencyInfo[] {
		const dependentKeys = this.#reverseDependencies.get(propertyKey);
		if (!dependentKeys || dependentKeys.size === 0) {
			return [];
		}

		const dependencies: DependencyInfo[] = [];

		for (const dependentKey of dependentKeys) {
			// Find the alias for this key
			let alias: string | undefined;
			for (const [a, k] of this.#aliasToKeyMap) {
				if (k === dependentKey) {
					alias = a;
					break;
				}
			}

			if (alias) {
				dependencies.push({
					alias,
					name: this.#aliasToNameMap.get(alias) ?? alias,
				});
			}
		}

		return dependencies;
	}
}

// Export as 'api' for the Extension Registry to initialize this class
export const api = UmbDocumentConditionalWorkspaceContext;

export default UmbDocumentConditionalWorkspaceContext;
