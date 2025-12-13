import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import { UmbContextToken } from '@umbraco-cms/backoffice/context-api';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import { UMB_PROPERTY_DATASET_CONTEXT } from '@umbraco-cms/backoffice/property';
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
	#datasetContext?: typeof UMB_PROPERTY_DATASET_CONTEXT.TYPE;

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
		console.log("in conditionals init");
		// Consume the document workspace context
		this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (context) => {
			this.#documentContext = context;

			// Get the content type ID and initialize
			const initializeContext = async () => {
				
				const contentTypeId = context?.getContentTypeUnique();
				
				
				if (contentTypeId) {

					console.log("Init - contentTypeId", contentTypeId);
					this.#documentTypeKey = contentTypeId;
					await this.#setupPropertyMappings();
					await this.#loadConfigurations();
					await this.#setupPropertyObservers();
					await this.#performInitialEvaluation();

				}
			};

			// Initialize immediately
			initializeContext();

			// Also observe unique to re-initialize when document changes
			this.observe(
				context?.contentTypeUnique,
				() => {
					initializeContext();
				},
				'observeDocumentUnique'
			);
		});

		// Consume the property dataset context
		this.consumeContext(UMB_PROPERTY_DATASET_CONTEXT, (context) => {
			this.#datasetContext = context;
		});
	}

	/**
	 * Load all conditional configurations for the current document type
	 */
	async #loadConfigurations() {
		debugger;
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
			debugger;
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
	 */
	async #setupPropertyObservers() {
		if (!this.#datasetContext) {
			console.warn('[ConditionalFields] Dataset context not available yet');
			return;
		}

		// Track which fields we need to observe (avoid duplicates)
		const fieldsToObserve = new Set<string>();

		// Collect all referenced fields from all conditional configurations
		for (const [, config] of this.#configurations) {
			if (!config.isConditional || !config.rules) {
				continue;
			}

			const referencedFields = ConditionalEvaluator.getReferencedFields(config.rules);
			for (const fieldAlias of referencedFields) {
				fieldsToObserve.add(fieldAlias);
			}
		}

		// Setup observers for each field
		for (const fieldAlias of fieldsToObserve) {
			try {
				const observable = await this.#datasetContext.propertyValueByAlias(fieldAlias);

				if (observable) {
					this.observe(
						observable,
						() => {
							this.#onPropertyValueChanged(fieldAlias);
						},
						`observe-property-${fieldAlias}`
					);
				}
			} catch (error) {
				console.warn(`[ConditionalFields] Could not observe property ${fieldAlias}:`, error);
			}
		}
	}

	/**
	 * Called when a property value changes
	 * Re-evaluates all properties that depend on the changed property
	 */
	#onPropertyValueChanged(changedFieldAlias: string) {
		// Find all properties that have rules referencing this field
		for (const [propertyKey, config] of this.#configurations) {
			if (!config.isConditional || !config.rules) {
				continue;
			}

			// Check if any rule references the changed field
			const referencedFields = ConditionalEvaluator.getReferencedFields(config.rules);
			if (referencedFields.has(changedFieldAlias)) {
				this.#evaluateAndApplyVisibility(propertyKey);
			}
		}
	}

	/**
	 * Perform initial evaluation for all conditional properties
	 * Called after observers are setup
	 */
	async #performInitialEvaluation() {
		// Wait a tick to ensure all properties are rendered
		await new Promise(resolve => setTimeout(resolve, 5000));

		for (const [propertyKey, config] of this.#configurations) {
			console.log("Initial eval for", {propertyKey, config});
			if (config.isConditional) {
				this.#evaluateAndApplyVisibility(propertyKey);
			}
		}
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

		for (const fieldAlias of referencedFields) {
			try {
				const observable = await this.#datasetContext?.propertyValueByAlias(fieldAlias);
				if (observable) {
					// Get the current value from the observable
					const currentValue = await new Promise((resolve) => {
						const subscription = observable.subscribe((value) => {
							subscription.unsubscribe();
							resolve(value);
						});
					});
					values.set(fieldAlias, currentValue);
				}
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
	 */
	#applyVisibilityToDOM(propertyAlias: string, visible: boolean) {
		// Find the workspace element
		debugger;
		const workspaceElement = document.querySelector('umb-content-workspace-view-edit');
		if (!workspaceElement) {
			console.warn('[ConditionalFields] Could not find workspace element');
			return;
		}

		// Try multiple selectors to find the property element
		// The exact selector may vary based on Umbraco's DOM structure
		const selectors = [
			`umb-property[alias="${propertyAlias}"]`,
			`umb-property[property-alias="${propertyAlias}"]`,
			`[data-property-alias="${propertyAlias}"]`,
			`[alias="${propertyAlias}"]`,
		];

		let propertyElement: Element | null = null;

		for (const selector of selectors) {
			propertyElement = workspaceElement.querySelector(selector);
			if (propertyElement) {
				break;
			}
		}

		if (!propertyElement) {
			console.warn(`[ConditionalFields] Could not find property element for: ${propertyAlias}`);
			return;
		}

		// Apply visibility
		(propertyElement as HTMLElement).style.display = visible ? '' : 'none';
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
