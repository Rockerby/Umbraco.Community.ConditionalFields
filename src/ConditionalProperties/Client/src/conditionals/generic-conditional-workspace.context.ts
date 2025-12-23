import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { PropertyConditionalConfiguration, DependencyInfo } from './types.js';
import { ConditionalEvaluator } from './conditional-evaluator.service.js';
import { ConditionalPropertiesService } from '../api/index.js';
import { createWorkspaceAdapter } from './adapters/workspace-adapter.factory.js';
import type { IWorkspaceAdapter } from './workspace-adapter.interface.js';

export const UMB_GENERIC_CONDITIONAL_WORKSPACE_CONTEXT = new UmbContextToken<UmbGenericConditionalWorkspaceContext>(
	'UmbGenericConditionalWorkspaceContext',
	'CndFlds.WorkspaceContext.Generic.Conditional'
);

/**
 * Generic workspace context for managing conditional field visibility
 * Works with any workspace type (Block, Media, etc.) using adapter pattern
 */
export class UmbGenericConditionalWorkspaceContext extends UmbContextBase {
	#adapter?: IWorkspaceAdapter;

	// Map of property type key to configuration
	#configurations = new Map<string, PropertyConditionalConfiguration>();

	// Map of property alias to property type key (for quick lookup)
	#aliasToKeyMap = new Map<string, string>();

	// Map of property alias to property name (for dependency info)
	#aliasToNameMap = new Map<string, string>();

	// Reverse dependency map: property key -> array of property keys that depend on it
	#reverseDependencies = new Map<string, Set<string>>();

	// Current content type key
	#contentTypeKey?: string;

	constructor(host: UmbControllerHost) {
		super(host, UMB_GENERIC_CONDITIONAL_WORKSPACE_CONTEXT);

		this.#init();
	}

	async #init() {
		console.log('[ConditionalProperties] Initializing generic workspace context');

		// Create appropriate adapter based on workspace type
		const adapter = await createWorkspaceAdapter(this._host);

		if (!adapter) {
			console.warn('[ConditionalProperties] No compatible workspace adapter found');
			return;
		}

		this.#adapter = adapter;

		console.log(`[ConditionalProperties] Using ${this.#adapter.getContentTypeName()} workspace adapter`);

		// Get the content type ID and initialize
		const contentTypeKey = this.#adapter.getContentTypeKey();

		if (contentTypeKey) {
			console.log('[ConditionalProperties] Init - contentTypeKey', contentTypeKey);
			this.#contentTypeKey = contentTypeKey;
			await this.#setupPropertyMappings();
			await this.#loadConfigurations();

			// Setup observers based on adapter type
			this.#setupObservers();

			await this.#performInitialEvaluation();
		}
	}

	/**
	 * Setup property change observers based on the adapter type
	 */
	#setupObservers() {
		if (!this.#adapter) {
			return;
		}

		const adapterName = this.#adapter.getContentTypeName();

		if (adapterName === 'Block') {
			// Block adapter - observe content and settings data
			const blockAdapter = this.#adapter as any;
			const blockContext = blockAdapter.getContext();

			if (blockContext) {
				// Observe content data
				if (blockContext.content) {
					this.observe(
						blockContext.content.data,
						() => {
							console.log('[ConditionalProperties] Block content data changed');
							this.#onAnyPropertyChanged();
						},
						'blockContentDataObserver'
					);
				}

				// Observe settings data
				if (blockContext.settings) {
					this.observe(
						blockContext.settings.data,
						() => {
							console.log('[ConditionalProperties] Block settings data changed');
							this.#onAnyPropertyChanged();
						},
						'blockSettingsDataObserver'
					);
				}
			}
		} else if (adapterName === 'Document') {
			// Document adapter - observe document data
			const documentAdapter = this.#adapter as any;
			const documentContext = documentAdapter.getContext();

			if (documentContext) {
				this.observe(
					documentContext.data,
					() => {
						console.log('[ConditionalProperties] Document data changed');
						this.#onAnyPropertyChanged();
					},
					'documentDataObserver'
				);

				this.observe(
					documentContext.contentTypeUnique,
					() => {
						console.log('[ConditionalProperties] Document content type changed');
						this.#onAnyPropertyChanged();
					},
					'documentContentTypeObserver'
				);
			}
		} else if (adapterName === 'Media') {
			// Media adapter - observe media data
			const mediaAdapter = this.#adapter as any;
			const mediaContext = mediaAdapter.getContext();

			if (mediaContext) {
				this.observe(
					mediaContext.data,
					() => {
						console.log('[ConditionalProperties] Media data changed');
						this.#onAnyPropertyChanged();
					},
					'mediaDataObserver'
				);

				this.observe(
					mediaContext.contentTypeUnique,
					() => {
						console.log('[ConditionalProperties] Media content type changed');
						this.#onAnyPropertyChanged();
					},
					'mediaContentTypeObserver'
				);
			}
		}
	}

	/**
	 * Called when any property value changes
	 * Re-evaluates all conditional properties
	 */
	#onAnyPropertyChanged() {
		console.log('[ConditionalProperties] Property value changed, re-evaluating all conditionals');
		for (const [propertyKey, config] of this.#configurations) {
			if (config.isConditional) {
				this.#evaluateAndApplyVisibility(propertyKey);
			}
		}
	}

	/**
	 * Load all conditional configurations for the current content type
	 */
	async #loadConfigurations() {
		if (!this.#contentTypeKey) {
			console.warn('[ConditionalProperties] No content type key available');
			return;
		}

		try {
			const { data, error } = await ConditionalPropertiesService.getAllConfigurations();

			if (error) {
				console.warn('[ConditionalProperties] Failed to load configurations:', error);
				return;
			}

			console.log('this.#configurations', { data, error });

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

			console.log('Built config, not doing build reserve', this.#configurations);

			// Build reverse dependency map
			this.#buildReverseDependencyMap();
		} catch (error) {
			console.error('[ConditionalProperties] Error loading configurations:', error);
		}
	}

	/**
	 * Setup mappings between property aliases, keys, and names
	 */
	async #setupPropertyMappings() {
		if (!this.#adapter) {
			console.warn('[ConditionalProperties] Adapter not available');
			return;
		}

		try {
			// Get all properties from the content type structure via adapter
			const allProperties = await this.#adapter.getPropertyStructures();

			if (!allProperties || allProperties.length === 0) {
				console.warn('[ConditionalProperties] No properties available');
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
			console.error('[ConditionalProperties] Error setting up property mappings:', error);
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
	 * Perform initial evaluation for all conditional properties
	 * Called after observers are setup
	 */
	async #performInitialEvaluation() {
		console.log('[ConditionalProperties] Performing initial evaluation of conditional properties');

		// Wait for the UI to be fully rendered using MutationObserver
		await this.#waitForUIRender();

		for (const [propertyKey, config] of this.#configurations) {
			console.log('Initial eval for', { propertyKey, config });
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
			console.log('[ConditionalProperties] Waiting for UI to render...');

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
				const docRoot = document.querySelector('umb-app');
				if (!docRoot) return null;
				return findInShadowDOM(docRoot);
			};

			// Check if properties already exist
			if (checkForProperties()) {
				console.log('[ConditionalProperties] Properties already rendered');
				// Give it a small additional delay for all properties to settle
				setTimeout(() => resolve(), 100);
				return;
			}

			// Set up MutationObserver to watch for when properties are added
			let timeoutId: number;
			const observer = new MutationObserver(() => {
				if (checkForProperties()) {
					console.log('[ConditionalProperties] Properties detected via MutationObserver');
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

			// Fallback timeout after 500ms (longer for modals)
			timeoutId = window.setTimeout(() => {
				console.warn('[ConditionalProperties] UI render timeout - proceeding anyway');
				observer.disconnect();
				resolve();
			}, 500);
		});
	}

	/**
	 * Evaluate rules for a property and apply visibility
	 */
	async #evaluateAndApplyVisibility(propertyKey: string) {
		const config = this.#configurations.get(propertyKey);
		console.log('Evaluating visibility for', { propertyKey, config });
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
			console.warn('[ConditionalProperties] Could not find alias for property key:', propertyKey);
			return;
		}

		// Collect current values for all referenced fields
		const values = new Map<string, any>();
		const referencedFields = ConditionalEvaluator.getReferencedFields(config.rules);

		// Get property values via adapter
		for (const fieldAlias of referencedFields) {
			try {
				const propertyValue = this.#adapter?.getPropertyValue(fieldAlias);
				values.set(fieldAlias, propertyValue);
				console.log(`[ConditionalProperties] Got value for ${fieldAlias}:`, propertyValue);
			} catch (error) {
				console.warn(`[ConditionalProperties] Could not get value for ${fieldAlias}:`, error);
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
		console.log(`[ConditionalProperties] Applying visibility to ${propertyAlias}: ${visible} (attempt ${retryCount + 1})`);

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
					console.log(`[ConditionalProperties] Found property element using selector: ${selector}`);
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
				console.warn(`[ConditionalProperties] Property element not found for: ${propertyAlias}, retrying in ${delay}ms...`);
				setTimeout(() => {
					this.#applyVisibilityToDOM(propertyAlias, visible, retryCount + 1);
				}, delay);
			} else {
				console.error(`[ConditionalProperties] Could not find property element for: ${propertyAlias} after ${retryCount} retries`);
			}
			return;
		}

		// Apply visibility
		(propertyElement as HTMLElement).style.display = visible ? '' : 'none';
		console.log(`[ConditionalProperties] Successfully applied visibility to ${propertyAlias}`);
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
				const name = this.#aliasToNameMap.get(alias) ?? alias;
				dependencies.push({ alias, name });
			}
		}

		return dependencies;
	}

	override destroy(): void {
		super.destroy();
		this.#adapter?.destroy();
	}
}

export { UmbGenericConditionalWorkspaceContext as api };
export default UmbGenericConditionalWorkspaceContext;
