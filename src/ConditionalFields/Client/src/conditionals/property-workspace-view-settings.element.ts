import { UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/property-type';
import { UMB_DOCUMENT_TYPE_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document-type';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import type { UmbPropertyTypeScaffoldModel } from '@umbraco-cms/backoffice/content-type';
import type { UmbWorkspaceViewElement } from '@umbraco-cms/backoffice/workspace';
import type { UUIBooleanInputEvent, UUIInputEvent, UUISelectEvent } from '@umbraco-cms/backoffice/external/uui';
import { UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT } from './document-conditional-workspace.context.js';
import type { ConditionalOperator, LogicalOperator, ConditionalRule, DependencyInfo } from './types.js';
import { ConditionalFieldsService } from "../api/index.js";

@customElement('cndflds-property-type-workspace-view-settings')
export class CndFldsPropertyTypeWorkspaceViewSettingsElement extends UmbLitElement implements UmbWorkspaceViewElement {
	#propertyTypeContext?: typeof UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT.TYPE;
	#documentTypeContext?: typeof UMB_DOCUMENT_TYPE_WORKSPACE_CONTEXT.TYPE;
	#conditionalContext?: typeof UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT.TYPE;

	@state()
	private _data?: UmbPropertyTypeScaffoldModel;

	@state()
	private _conditionalRules: ConditionalRule[] = [];

	@state()
	private _availableFields: Array<{ value: string; name: string }> = [];

	@state()
	private _currentPropertyAlias?: string;

	@state()
	private _currentPropertyKey?: string;

	@state()
	private _isConditional: boolean = false;

	@state()
	private _isSaving: boolean = false;

	@state()
	private _dependentFields: DependencyInfo[] = [];

	constructor() {
		super();

		// Consume the property type workspace context (current property being edited)
		this.consumeContext(UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT, (instance) => {
			this.#propertyTypeContext = instance;
			this.observe(instance?.data, (data) => {
				this._data = data;
				this._currentPropertyAlias = data?.alias;
				this._currentPropertyKey = data?.unique;

				// Load the configuration when property data changes
				this.#loadAvailableFields();
				this.#loadConfiguration();
			}, 'observeData');
		});

		// Consume the document type workspace context to access all properties
		// Using .passContextAliasMatches() allows us to get the parent context
		this.consumeContext(UMB_DOCUMENT_TYPE_WORKSPACE_CONTEXT, (instance) => {
			this.#documentTypeContext = instance;

			// Observe the structure to get property changes
			this.observe(
				instance?.structure.contentTypeProperties,
				() => {
					this.#loadAvailableFields();
				},
				'observeContentTypeProperties'
			);
		}).passContextAliasMatches();

		// Consume the conditional workspace context (optional - only exists in document editor)
		// Use try-catch as .optional() may not be available in all Umbraco versions
		try {
			this.consumeContext(UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT, (instance) => {
				this.#conditionalContext = instance;
				// Load dependencies when context becomes available
				this.#loadDependencies();
			});
		} catch (error) {
			// Context not available - this is expected when editing property types outside document context
		}
	}

	async #loadAvailableFields() {
		if (!this.#documentTypeContext) {
			console.warn('Document type context not available yet');
			return;
		}

		try {
			// Get all properties from the document type structure (including compositions)
			const allProperties = await this.#documentTypeContext.structure.getContentTypeProperties();

			// Filter out the current property being edited (optional - prevents self-reference)
			// and map to the format needed for the dropdown
			this._availableFields = allProperties
				.filter(prop => prop.alias !== this._currentPropertyAlias)
				.map(prop => ({
					value: prop.alias ?? '',
					name: `${prop.name} (${prop.alias})`,
					selected: false
				}))
				.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
		} catch (error) {
			console.error('Error loading available fields:', error);
			this._availableFields = [];
		}
	}

	async #loadConfiguration() {
		if (!this._currentPropertyKey) {
			return;
		}

		try {
			const { data, error } = await ConditionalFieldsService.getConfiguration({
				path: {
					propertyTypeKey: this._currentPropertyKey
				}
			});
			var propKey= this._currentPropertyKey;
			console.log("Loaded configuration", { propKey, data, error });	
			if (data) {
				this._isConditional = data.isConditional ?? false;
				this._conditionalRules = data.rules ?? [];
			} else if (error) {
				console.error('Error loading conditional configuration:', error);
			}
		} catch (error) {
			console.error('Error loading conditional configuration:', error);
		}

		// Also load dependencies
		this.#loadDependencies();
	}

	#loadDependencies() {
		if (!this._currentPropertyKey || !this.#conditionalContext) {
			this._dependentFields = [];
			return;
		}

		try {
			this._dependentFields = this.#conditionalContext.getDependenciesFor(this._currentPropertyKey);
		} catch (error) {
			console.error('Error loading dependencies:', error);
			this._dependentFields = [];
		}
	}

	async #saveConfiguration() {
		if (!this._currentPropertyKey) {
			console.error('Cannot save: property key not available');
			return;
		}

		if(this._isSaving) return; // Prevent concurrent saves

		this._isSaving = true;

		try {
			const { error } = await ConditionalFieldsService.saveConfiguration({
				path: {
					propertyTypeKey: this._currentPropertyKey
				},
				body: {
					isConditional: this._isConditional,
					rules: this._conditionalRules
				}
			});

			if (error) {
				console.error('Failed to save configuration:', error);
			}
		} catch (error) {
			console.error('Error saving conditional configuration:', error);
		} finally {
			this._isSaving = false;
		}
	}

	updateValue(partialValue: Partial<UmbPropertyTypeScaffoldModel>) {
		this.#propertyTypeContext?.updateData(partialValue);
	}

	#onConditionalChange(event: UUIBooleanInputEvent) {
		this._isConditional = event.target.checked;

		// If disabling conditionals, clear the rules
		if (!this._isConditional) {
			this._conditionalRules = [];
		}

		this.#saveConfiguration();
	}

	#addConditionalRule() {
		const newRule: ConditionalRule = {
			id: crypto.randomUUID(),
			fieldAlias: '',
			operator: 'Equals',
			value: '',
			logicalOperator: this._conditionalRules.length > 0 ? 'And' : 'And',
		};
		this._conditionalRules = [...this._conditionalRules, newRule];
		this.#saveConfiguration();
	}

	#removeConditionalRule(id: string) {
		// TODO: Better confirmation dialog
		if(confirm("Are you sure you want to remove this rule?")){
			this._conditionalRules = this._conditionalRules.filter((rule) => rule.id !== id);
			// Ensure first rule always has 'And' as logical operator (API requirement)
			if (this._conditionalRules.length > 0) {
				this._conditionalRules[0] = { ...this._conditionalRules[0], logicalOperator: 'And' };
			}
			this.#saveConfiguration();
		}
	}

	#updateConditionalRule(id: string, updates: Partial<ConditionalRule>) {
		this._conditionalRules = this._conditionalRules.map((rule) =>
			rule.id === id ? { ...rule, ...updates } : rule
		);
		this.#saveConfiguration();
	}

	#onFieldChange(id: string, event: UUISelectEvent) {
		this.#updateConditionalRule(id, { fieldAlias: event.target.value as string });
	}

	#onOperatorChange(id: string, event: UUISelectEvent) {
		this.#updateConditionalRule(id, { operator: event.target.value as ConditionalOperator });
	}

	#onValueChange(id: string, event: UUIInputEvent) {
		this.#updateConditionalRule(id, { value: event.target.value.toString() });
	}

	#onLogicalOperatorChange(id: string, event: UUISelectEvent) {
		this.#updateConditionalRule(id, { logicalOperator: event.target.value as LogicalOperator });
	}

	#operatorRequiresValue(operator: ConditionalOperator): boolean {
		return !['IsEmpty', 'IsNotEmpty'].includes(operator);
	}

	override render() {
		if (!this._data) return;
		return html`
			${this.#renderDependencyWarning()}

			<uui-box class="uui-text">
				<umb-localize key="validation_conditional" slot="headline">Conditional</umb-localize>
				${this.#renderMandatory()}</uui-box
			>

		`;
	}

	#renderDependencyWarning() {
		if (!this._dependentFields || this._dependentFields.length === 0) {
			return '';
		}

		return html`
			<uui-box class="dependency-warning">
				<div class="warning-content">
					<div class="warning-header">
						<uui-icon name="icon-alert"></uui-icon>
						<strong>Dependency Warning</strong>
					</div>
					<p>
						${this._dependentFields.length === 1
							? html`<strong>1 other field</strong> depends on this field:`
							: html`<strong>${this._dependentFields.length} other fields</strong> depend on this field:`}
					</p>
					<ul class="dependency-list">
						${this._dependentFields.map(
							(field) => html`<li>${field.name} <span class="field-alias">(${field.alias})</span></li>`
						)}
					</ul>
					<p class="warning-note">
						Changes to this field's configuration may affect the visibility of these dependent fields.
					</p>
				</div>
			</uui-box>
		`;
	}

	#renderMandatory() {
		return html`<umb-property-layout orientation="vertical">
				<uui-toggle
					@change=${this.#onConditionalChange}
					id="conditional"
					.checked=${this._isConditional}
					slot="editor"
					><umb-localize key="validation_fieldIsConditional">Field is conditional</umb-localize></uui-toggle
				></umb-property-layout
			>

			${this._isConditional
				? html`
					${this.#renderConditionals()}
					`
				: ''} `;
	}

	#renderConditionals() {
		return html`
			<div class="conditionals-section">
				<umb-property-layout orientation="vertical">
					<div slot="editor" class="conditionals-container">
						${this._conditionalRules.map((rule, index) => this.#renderConditionalRule(rule, index))}

						<uui-button
							look="placeholder"
							label="Add Conditional"
							@click=${this.#addConditionalRule}
							color="default">
							<uui-icon name="icon-add"></uui-icon>
							Add Conditional Rule
						</uui-button>
					</div>
				</umb-property-layout>
			</div>
		`;
	}

	#renderConditionalRule(rule: ConditionalRule, index: number) {
		const operators: Array<{ value: ConditionalOperator; name: string }> = [
			{ value: 'Equals', name: 'Equals' },
			{ value: 'NotEquals', name: 'Does Not Equal' },
			{ value: 'Contains', name: 'Contains' },
			{ value: 'NotContains', name: 'Does Not Contain' },
			{ value: 'GreaterThan', name: 'Greater Than' },
			{ value: 'LessThan', name: 'Less Than' },
			{ value: 'IsEmpty', name: 'Is Empty' },
			{ value: 'IsNotEmpty', name: 'Is Not Empty' },
		];

		const groupingOperators: Array<{ value: LogicalOperator; name: string }> = [
			{ value: 'Or', name: 'Or' },
			{ value: 'And', name: 'And' }
		];

		return html`
			${index > 0
				? html`
					<div class="logical-operator-row">
						<uui-select
							.value=${rule.logicalOperator || 'And'}
							@change=${(e: UUISelectEvent) => this.#onLogicalOperatorChange(rule.id, e)}
							label="Logical Operator"
							.options=${groupingOperators.map(op => ({
								...op,
								selected: op.value === rule.logicalOperator
							}))}
							>
						</uui-select>
					</div>
				`
				: ''}

			<div class="conditional-rule">
				<div class="rule-fields">
					<div class="rule-field">
						<label>Field</label>
						<uui-select
							@change=${(e: UUISelectEvent) => this.#onFieldChange(rule.id, e)}
							placeholder="Select a field"
							label="Field"
							.options=${this._availableFields.map(field => ({
								...field,
								selected: field.value === rule.fieldAlias
							}))}>
						</uui-select>
					</div>

					<div class="rule-field">
						<label>Condition</label>
						<uui-select
							@change=${(e: UUISelectEvent) => this.#onOperatorChange(rule.id, e)}
							label="Operator"
							.options=${operators.map(op => ({
								...op,
								selected: op.value === rule.operator
							}))}>
						</uui-select>
					</div>

					${this.#operatorRequiresValue(rule.operator)
						? html`
							<div class="rule-field">
								<label>Value</label>
								<uui-input
									.value=${rule.value}
									@input=${(e: UUIInputEvent) => this.#onValueChange(rule.id, e)}
									placeholder="Enter value"
									label="Value">
								</uui-input>
							</div>
						`
						: ''}
				</div>

				<uui-button
					look="primary"
					color="danger"
					compact
					@click=${() => this.#removeConditionalRule(rule.id)}
					label="Remove rule">
					<uui-icon name="icon-delete"></uui-icon>
				</uui-button>
			</div>
		`;
	}

	static override styles = [
		UmbTextStyles,
		css`
			:host {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-layout-1);
				padding: var(--uui-size-layout-1);
			}
			umb-property-layout[orientation='vertical'] {
				padding: var(--uui-size-space-2) 0;
			}

			umb-property-layout:first-of-type {
				padding-top: 0;
			}
			umb-property-layout:last-of-type {
				padding-bottom: 0;
			}

			uui-select {
				width: 100%;
			}

			#appearances {
				display: flex;
				gap: var(--uui-size-space-4);
			}

			.appearance {
				position: relative;
				display: flex;
				border: 1px solid var(--uui-color-border-standalone);
				background-color: transparent;
				padding: var(--uui-size-space-4) var(--uui-size-space-5);
				align-items: center;
				border-radius: var(--uui-border-radius);
				opacity: 0.8;
				flex-direction: column;
				justify-content: space-between;
				gap: var(--uui-size-space-3);
			}

			.appearance-option {
				display: flex;
				width: 100%;
				flex-direction: column;
				gap: var(--uui-size-space-2);
			}

			.appearance-label {
				font-size: 0.8rem;
				line-height: 1;
				text-align: center;
				pointer-events: none;
			}

			.appearance svg {
				display: flex;
				width: 100%;
				color: var(--uui-color-text);
			}

			.appearance:not(.selected):hover {
				border-color: var(--uui-color-border-emphasis);
				cursor: pointer;
				opacity: 1;
			}

			.appearance.selected {
				background-color: var(--uui-color-surface);
				border-color: var(--uui-color-selected);
				color: var(--uui-color-selected);
				opacity: 1;
			}

			.appearance.selected svg {
				color: var(--uui-color-selected);
			}

			.appearance.selected::after {
				content: '';
				position: absolute;
				inset: 0;
				border-radius: 6px;
				opacity: 0.1;
				background-color: var(--uui-color-selected);
			}

			uui-input {
				width: 100%;
			}

			uui-input:focus-within {
				z-index: 1;
			}

			.container {
				display: flex;
				flex-direction: column;
			}

			.conditionals-section {
				margin-top: var(--uui-size-space-4);
			}

			.conditionals-container {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-4);
			}

			.logical-operator-row {
				display: flex;
				justify-content: center;
				margin: var(--uui-size-space-2) 0;
			}

			.logical-operator-row uui-select {
				width: 120px;
				text-align: center;
			}

			.conditional-rule {
				display: flex;
				gap: var(--uui-size-space-3);
				align-items: flex-end;
				padding: var(--uui-size-space-4);
				border: 1px solid var(--uui-color-border);
				border-radius: var(--uui-border-radius);
				background-color: var(--uui-color-surface);
			}

			.rule-fields {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-3);
				flex: 1;
			}

			.rule-field {
				display: flex;
				flex-direction: column;
				gap: var(--uui-size-space-1);
			}

			.rule-field label {
				font-size: 0.875rem;
				font-weight: 600;
				color: var(--uui-color-text);
			}

			.rule-field uui-select,
			.rule-field uui-input {
				width: 100%;
			}

			uui-button[look="placeholder"] {
				margin-top: var(--uui-size-space-2);
			}

			.dependency-warning {
				margin-bottom: var(--uui-size-layout-1);
				border-left: 3px solid var(--uui-color-warning);
				background-color: var(--uui-color-warning-bg, #fff3cd);
			}

			.warning-content {
				padding: var(--uui-size-space-4);
			}

			.warning-header {
				display: flex;
				align-items: center;
				gap: var(--uui-size-space-2);
				margin-bottom: var(--uui-size-space-3);
				color: var(--uui-color-warning-emphasis, #856404);
			}

			.warning-header uui-icon {
				font-size: 1.2rem;
			}

			.warning-header strong {
				font-size: 1rem;
			}

			.warning-content p {
				margin: var(--uui-size-space-2) 0;
				color: var(--uui-color-warning-emphasis, #856404);
			}

			.dependency-list {
				margin: var(--uui-size-space-3) 0;
				padding-left: var(--uui-size-space-6);
				list-style: disc;
			}

			.dependency-list li {
				margin: var(--uui-size-space-1) 0;
				color: var(--uui-color-warning-emphasis, #856404);
			}

			.field-alias {
				font-family: monospace;
				opacity: 0.8;
				font-size: 0.9em;
			}

			.warning-note {
				font-size: 0.875rem;
				font-style: italic;
				opacity: 0.9;
				margin-top: var(--uui-size-space-3);
			}
		`,
	];
}

export default CndFldsPropertyTypeWorkspaceViewSettingsElement;

declare global {
	interface HTMLElementTagNameMap {
		'cndfld-property-type-workspace-view-settings': CndFldsPropertyTypeWorkspaceViewSettingsElement;
	}
}
