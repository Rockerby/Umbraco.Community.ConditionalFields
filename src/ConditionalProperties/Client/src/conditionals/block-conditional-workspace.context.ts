import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UMB_BLOCK_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/block';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { PropertyConditionalConfiguration, DependencyInfo } from './types.js';
import { ConditionalEvaluator } from './conditional-evaluator.service.js';
import { ConditionalPropertiesService } from '../api/index.js';

export const UMB_BLOCK_CONDITIONAL_WORKSPACE_CONTEXT = new UmbContextToken<UmbBlockConditionalWorkspaceContext>(
	'UmbBlockConditionalWorkspaceContext',
	'CndFlds.WorkspaceContext.Block.Conditional'
);

/**
 * Workspace context for managing conditional field visibility in block editing
 * This context works within block modals and accesses the parent document context
 */
export class UmbBlockConditionalWorkspaceContext extends UmbContextBase {
	#blockContext?: typeof UMB_BLOCK_WORKSPACE_CONTEXT.TYPE;
	#documentContext?: typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE;

	// Map of property type key to configuration
	#configurations = new Map<string, PropertyConditionalConfiguration>();

	// Map of property alias to property type key (for quick lookup)
	#aliasToKeyMap = new Map<string, string>();

	// Map of property alias to property name (for dependency info)
	#aliasToNameMap = new Map<string, string>();

	// Reverse dependency map: property key -> array of property keys that depend on it
	#reverseDependencies = new Map<string, Set<string>>();

	// Current block content type key
	#contentTypeKey?: string;

	constructor(host: UmbControllerHost) {
		super(host, UMB_BLOCK_CONDITIONAL_WORKSPACE_CONTEXT);
		this.#init();
	}

	async #init() {
		console.log("[ConditionalProperties] ========================================");
		console.log("[ConditionalProperties] Initializing BLOCK workspace context");
		console.log("[ConditionalProperties] ========================================");

		// First, consume the block workspace context
		this.consumeContext(UMB_BLOCK_WORKSPACE_CONTEXT, async (blockContext) => {
			console.log("[ConditionalProperties] ✓ Block workspace context consumed", blockContext);
			this.#blockContext = blockContext;

			// Now try to access the parent document workspace context
			// This is key: we traverse UP the context tree to find the document context
			try {
				this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, async (documentContext) => {
					console.log("[ConditionalProperties] ✓ Document workspace context consumed from block", documentContext);
					this.#documentContext = documentContext;
				}).passContextAliasMatches(); // This allows traversing up the context tree
			} catch (error) {
				console.warn("[ConditionalProperties] Could not access document context (this is OK if not in a document)", error);
			}

			await this.#setupBlock();
		});
	}

	async #setupBlock() {
		// Get the content type from the block workspace content element
		const contentTypeId = this.#blockContext?.content.getContentTypeId?.();

		console.log("[ConditionalProperties] Setting up block...", { contentTypeId });

		if (!contentTypeId) {
			console.warn('[ConditionalProperties] No content type ID available for block');
			return;
		}

		console.log("[ConditionalProperties] Block contentTypeId:", contentTypeId);
		this.#contentTypeKey = contentTypeId;

		await this.#setupPropertyMappings();
		await this.#loadConfigurations();
		await this.#setupPropertyObservers();
		await this.#performInitialEvaluation();

		console.log("[ConditionalProperties] Block setup complete");

		// Observe block content data changes
		this.observe(
			this.#blockContext?.content.data,
			() => {
				console.log("[ConditionalProperties] Block content data changed");
				this.#onAnyPropertyChanged();
			},
			'observeBlockContentData'
		);

		// Also observe block settings data changes
		this.observe(
			this.#blockContext?.settings.data,
			() => {
				console.log("[ConditionalProperties] Block settings data changed");
				this.#onAnyPropertyChanged();
			},
			'observeBlockSettingsData'
		);

		// Also observe parent document data changes (if properties in block depend on document properties)
		if (this.#documentContext) {
			this.observe(
				this.#documentContext.data,
				() => {
					console.log("[ConditionalProperties] Parent document data changed");
					this.#onAnyPropertyChanged();
				},
				'observeDocumentData'
			);
		}
	}

	/**
	 * Called when any property value changes
	 * Re-evaluates all conditional properties
	 */
	#onAnyPropertyChanged() {
		console.log("[ConditionalProperties] Property value changed in block, re-evaluating all conditionals");
		for (const [propertyKey, config] of this.#configurations) {
			if (config.isConditional) {
				this.#evaluateAndApplyVisibility(propertyKey);
			}
		}
	}

	/**
	 * Load all conditional configurations for the current block content type
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

			console.log("Block configurations", { data, error });

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

			console.log("Built block config", this.#configurations);
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
		if (!this.#blockContext) {
			console.warn('[ConditionalProperties] Block context not available');
			return;
		}

		try {
			// For blocks, get properties from the block's content element structure
			const structure = this.#blockContext.content.structure;
			const allProperties = await structure?.getContentTypeProperties();

			if (!allProperties) {
				console.warn('[ConditionalProperties] No properties available');
				return;
			}

			// Clear existing mappings
			this.#aliasToKeyMap.clear();
			this.#aliasToNameMap.clear();

			// Build mappings for content properties
			for (const prop of allProperties) {
				if (prop.alias && prop.unique) {
					this.#aliasToKeyMap.set(prop.alias, prop.unique);
					this.#aliasToNameMap.set(prop.alias, prop.name ?? prop.alias);
					console.log(`[ConditionalProperties] Mapped content property: ${prop.alias} => ${prop.unique}`);
				}
			}

			// Also get settings properties if they exist
			const settingsStructure = this.#blockContext.settings.structure;
			const settingsProperties = await settingsStructure?.getContentTypeProperties();

			if (settingsProperties) {
				console.log(`[ConditionalProperties] Found ${settingsProperties.length} settings properties`);
				for (const prop of settingsProperties) {
					if (prop.alias && prop.unique) {
						this.#aliasToKeyMap.set(prop.alias, prop.unique);
						this.#aliasToNameMap.set(prop.alias, prop.name ?? prop.alias);
						console.log(`[ConditionalProperties] Mapped settings property: ${prop.alias} => ${prop.unique}`);
					}
				}
			}

			console.log('[ConditionalProperties] Block property mappings complete. Total:', this.#aliasToKeyMap.size);
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

		console.log('Block Reverse Dependency Map:', this.#reverseDependencies);
	}

	/**
	 * Setup observers for all properties referenced in conditional rules
	 * Note: We're now using block data observer instead of individual property observers
	 */
	async #setupPropertyObservers() {
		console.log("[ConditionalProperties] Block property observers setup (using block data observer)");
		// The actual observation is now done via blockContext.data in #setupBlock
		// This method is kept for compatibility but doesn't set up individual observers anymore
	}

	/**
	 * Perform initial evaluation for all conditional properties
	 * Called after observers are setup
	 */
	async #performInitialEvaluation() {
		console.log("[ConditionalProperties] Performing initial evaluation of conditional properties in block");

		// Wait for the UI to be fully rendered using MutationObserver
		await this.#waitForUIRender();

		console.log(`[ConditionalProperties] UI rendered, evaluating ${this.#configurations.size} configurations`);

		for (const [propertyKey, config] of this.#configurations) {
			console.log("Initial eval for block property", {propertyKey, config});
			if (config.isConditional) {
				this.#evaluateAndApplyVisibility(propertyKey);
			}
		}

		console.log("[ConditionalProperties] Initial evaluation complete");
	}

	/**
	 * Wait for the UI to be rendered by watching for property elements in the DOM
	 * Uses MutationObserver to detect when content is added
	 */
	async #waitForUIRender(): Promise<void> {
		return new Promise((resolve) => {
			console.log("[ConditionalProperties] Waiting for block UI to render...");

			// First, try to find any umb-property element within block modal
			const checkForProperties = () => {
				const findInShadowDOM = (root: Document | ShadowRoot | Element): Element | null => {
					// Look for block workspace first
					const blockWorkspace = root.querySelector('umb-block-list-workspace, umb-block-grid-workspace, umb-block-rte-workspace');
					if (blockWorkspace) {
						const property = blockWorkspace.querySelector('umb-property');
						if (property) return property;
						if (blockWorkspace.shadowRoot) {
							const found = findInShadowDOM(blockWorkspace.shadowRoot);
							if (found) return found;
						}
					}

					// Fallback to general search
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

				return findInShadowDOM(document);
			};

			// Check if properties already exist
			if (checkForProperties()) {
				console.log("[ConditionalProperties] Block properties already rendered");
				// Give it a small additional delay for all properties to settle
				setTimeout(() => resolve(), 100);
				return;
			}

			// Set up MutationObserver to watch for when properties are added
			let timeoutId: number;
			const observer = new MutationObserver(() => {
				if (checkForProperties()) {
					console.log("[ConditionalProperties] Block properties detected via MutationObserver");
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

			// Fallback timeout after 3 seconds
			timeoutId = window.setTimeout(() => {
				console.warn("[ConditionalProperties] Block UI render timeout - proceeding anyway");
				observer.disconnect();
				resolve();
			}, 3000);
		});
	}

	/**
	 * Evaluate rules for a property and apply visibility
	 */
	async #evaluateAndApplyVisibility(propertyKey: string) {
		const config = this.#configurations.get(propertyKey);
		console.log("Evaluating visibility for block property", {propertyKey, config});

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

		// Get block content data
		const blockContentData = this.#blockContext?.content.getData();
		const blockContentValues = blockContentData?.values || [];

		// Get block settings data
		const blockSettingsData = this.#blockContext?.settings.getData();
		const blockSettingsValues = blockSettingsData?.values || [];

		// Get parent document data (if available)
		const documentData = this.#documentContext?.getData();

		for (const fieldAlias of referencedFields) {
			try {
				// First, try to get value from block content
				let propertyValue = blockContentValues.find((v: any) => v.alias === fieldAlias)?.value;

				// If not found in content, try block settings
				if (propertyValue === undefined) {
					propertyValue = blockSettingsValues.find((v: any) => v.alias === fieldAlias)?.value;
				}

				// If not found in block, try parent document
				if (propertyValue === undefined && documentData) {
					propertyValue = documentData?.values?.find((v: any) => v.alias === fieldAlias)?.value;
					console.log(`[ConditionalProperties] Got value for ${fieldAlias} from parent document:`, propertyValue);
				} else {
					console.log(`[ConditionalProperties] Got value for ${fieldAlias} from block:`, propertyValue);
				}

				values.set(fieldAlias, propertyValue);
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
	 * Apply visibility to a property element in the DOM (within block modal)
	 * Includes retry logic if element not found immediately
	 */
	#applyVisibilityToDOM(propertyAlias: string, visible: boolean, retryCount = 0) {
		console.log(`[ConditionalProperties] Applying visibility in block to ${propertyAlias}: ${visible} (attempt ${retryCount + 1})`);

		// Start searching from the document root
		const propertyElement = this.#findPropertyInBlockModal(propertyAlias);

		if (!propertyElement) {
			// If not found and we haven't retried too many times, try again after a delay
			if (retryCount < 5) {
				const delay = 200 * (retryCount + 1); // Exponential backoff: 200ms, 400ms, 600ms, etc.
				console.warn(`[ConditionalProperties] Property element not found in block for: ${propertyAlias}, retrying in ${delay}ms...`);
				setTimeout(() => {
					this.#applyVisibilityToDOM(propertyAlias, visible, retryCount + 1);
				}, delay);
			} else {
				console.error(`[ConditionalProperties] Could not find property element in block for: ${propertyAlias} after ${retryCount} retries`);
				console.error(`[ConditionalProperties] Tried searching in document for property with alias: ${propertyAlias}`);
			}
			return;
		}

		// Apply visibility
		(propertyElement as HTMLElement).style.display = visible ? '' : 'none';
		console.log(`[ConditionalProperties] ✓ Successfully applied visibility in block to ${propertyAlias}`);
	}

	/**
	 * Find a property element within the block modal
	 * Searches recursively through the shadow DOM starting from the umb-app element
	 */
	#findPropertyInBlockModal(propertyAlias: string): Element | null {
		console.log(`[ConditionalProperties] Searching for property: ${propertyAlias}`);

		// Start from umb-app shadow root if available, otherwise use document
		const umbApp = document.querySelector('umb-app');
		const startRoot = (umbApp?.shadowRoot) || document;

		console.log(`[ConditionalProperties] Starting search from: ${umbApp?.shadowRoot ? 'umb-app shadowRoot' : 'document'}`);

		return this.#searchForProperty(startRoot, propertyAlias);
	}

	/**
	 * Search for a property element by alias
	 * depth parameter is for debugging only
	 */
	#searchForProperty(root: Document | ShadowRoot | Element, propertyAlias: string, depth: number = 0): Element | null {
		// Prevent infinite recursion
		if (depth > 25) {
			console.warn(`[ConditionalProperties] Max search depth reached`);
			return null;
		}

		// Try to find the property directly with multiple selectors
		const selectors = [
			`umb-property[alias="${propertyAlias}"]`,
			`umb-property[property-alias="${propertyAlias}"]`,
			`[data-property-alias="${propertyAlias}"]`,
			`[alias="${propertyAlias}"]`,
		];

		for (const selector of selectors) {
			const element = root.querySelector(selector);
			if (element) {
				console.log(`[ConditionalProperties] ✓ Found property element using selector: ${selector} at depth ${depth}`);
				return element;
			}
		}

		// Look for all umb-property elements and check their attributes
		const allProperties = root.querySelectorAll('umb-property');
		if (allProperties.length > 0) {
			console.log(`[ConditionalProperties] Found ${allProperties.length} umb-property elements at depth ${depth}`);
		}

		for (const prop of allProperties) {
			const alias = prop.getAttribute('alias') ||
			              prop.getAttribute('property-alias') ||
			              prop.getAttribute('data-property-alias');

			if (alias === propertyAlias) {
				console.log(`[ConditionalProperties] ✓ Found property by attribute match: ${alias} at depth ${depth}`);
				return prop;
			}
		}

		// ALSO look for umb-property-type-based-property elements (used in block workspaces)
		// These have the alias in a data-path attribute like: $.values[?(@.alias == 'checkMe' && ...)]
		const typedProperties = root.querySelectorAll('umb-property-type-based-property');
		if (typedProperties.length > 0) {
			console.log(`[ConditionalProperties] Found ${typedProperties.length} umb-property-type-based-property elements at depth ${depth}`);
		}

		for (const prop of typedProperties) {
			const dataPath = prop.getAttribute('data-path');
			if (dataPath) {
				// Extract alias from data-path using regex
				const match = dataPath.match(/@\.alias == '([^']+)'/);
				if (match && match[1] === propertyAlias) {
					console.log(`[ConditionalProperties] ✓ Found property by data-path match: ${match[1]} at depth ${depth}`);

					// The umb-property-type-based-property is inside a shadow root
					// We need to hide/show the shadow root's host element
					const rootNode = prop.getRootNode();
					if (rootNode instanceof ShadowRoot && rootNode.host) {
						const host = rootNode.host as Element;
						console.log(`[ConditionalProperties] ✓ Property is in shadow root, returning host element: ${host.tagName}`);
						return host;
					}

					// Fallback: return parent element if it exists
					const wrapper = prop.parentElement;
					if (wrapper) {
						console.log(`[ConditionalProperties] ✓ Returning parent wrapper element: ${wrapper.tagName}`);
						return wrapper;
					}

					// Last resort: return the property itself
					return prop;
				}
			}
		}

		// If not found, traverse into shadow roots
		const allElements = root.querySelectorAll('*');
		for (const element of allElements) {
			if (element.shadowRoot) {
				const found = this.#searchForProperty(element.shadowRoot, propertyAlias, depth + 1);
				if (found) {
					return found;
				}
			}
		}

		return null;
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
export const api = UmbBlockConditionalWorkspaceContext;

export default UmbBlockConditionalWorkspaceContext;
