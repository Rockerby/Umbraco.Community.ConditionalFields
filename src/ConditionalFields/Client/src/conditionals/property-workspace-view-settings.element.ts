import { UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/property-type';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UMB_VALIDATION_EMPTY_LOCALIZATION_KEY } from '@umbraco-cms/backoffice/validation';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import type { UmbPropertyTypeScaffoldModel } from '@umbraco-cms/backoffice/content-type';
import type { UmbWorkspaceViewElement } from '@umbraco-cms/backoffice/workspace';
import type { UUIBooleanInputEvent, UUIInputEvent, UUISelectEvent } from '@umbraco-cms/backoffice/external/uui';

// Type definitions for conditional logic
type ConditionalOperator = 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
type LogicalOperator = 'and' | 'or';

interface ConditionalRule {
	id: string;
	fieldAlias: string;
	operator: ConditionalOperator;
	value: string;
	logicalOperator?: LogicalOperator;
}

@customElement('cndflds-property-type-workspace-view-settings')
export class CndFldsPropertyTypeWorkspaceViewSettingsElement extends UmbLitElement implements UmbWorkspaceViewElement {
	#context?: typeof UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT.TYPE;

	@state()
	private _data?: UmbPropertyTypeScaffoldModel;

	@state()
	private _conditionalRules: ConditionalRule[] = [];

	@state()
	private _availableFields: Array<{ value: string; name: string }> = [];

	constructor() {
		super();

		console.log("out");

		this.consumeContext(UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT, (instance) => {
			this.#context = instance;
			this.observe(instance?.data, (data) => {
				this._data = data;
				this.#loadAvailableFields();
			}, 'observeData');
			//   this.observe(instance?.isNew, (isNew) => (this._isNew = isNew), '_observeIsNew');
		});

		// this.consumeContext(UMB_CONTENT_TYPE_WORKSPACE_CONTEXT, (instance) => {
		//   this.observe(
		//     instance?.variesByCulture,
		//     (variesByCulture) => (this._contentTypeVariesByCulture = variesByCulture),
		//     'observeVariesByCulture',
		//   );
		//   this.observe(
		//     instance?.variesBySegment,
		//     (variesBySegment) => (this._contentTypeVariesBySegment = variesBySegment),
		//     'observeVariesBySegment',
		//   );
		//   this._entityType = instance?.getEntityType();
		// }).passContextAliasMatches();
	}

	async #loadAvailableFields() {
		// TODO: Load available fields from the content type
		// For now, populate with placeholder data
		// You'll need to get the content type from the parent context and extract its properties
		this._availableFields = [
			{ value: 'title', name: 'Title' },
			{ value: 'description', name: 'Description' },
			{ value: 'isActive', name: 'Is Active' },
		];
	}

	updateValue(partialValue: Partial<UmbPropertyTypeScaffoldModel>) {
		this.#context?.updateData(partialValue);
	}

	#onConditionalChange(event: UUIBooleanInputEvent) {
		const mandatory = event.target.checked;
		this.updateValue({
			validation: { ...this._data?.validation, mandatory },
		});
	}

	#onMandatoryMessageChange(event: UUIInputEvent) {
		const mandatoryMessage = event.target.value.toString();
		this.updateValue({
			validation: { ...this._data?.validation, mandatory: this._data?.validation.mandatory ?? false, mandatoryMessage },
		});
	}

	#addConditionalRule() {
		const newRule: ConditionalRule = {
			id: crypto.randomUUID(),
			fieldAlias: '',
			operator: 'equals',
			value: '',
			logicalOperator: this._conditionalRules.length > 0 ? 'and' : undefined,
		};
		this._conditionalRules = [...this._conditionalRules, newRule];
	}

	#removeConditionalRule(id: string) {
		this._conditionalRules = this._conditionalRules.filter((rule) => rule.id !== id);
		// If we removed the first rule and there are more rules, remove the logical operator from the new first rule
		if (this._conditionalRules.length > 0) {
			this._conditionalRules[0] = { ...this._conditionalRules[0], logicalOperator: undefined };
		}
	}

	#updateConditionalRule(id: string, updates: Partial<ConditionalRule>) {
		this._conditionalRules = this._conditionalRules.map((rule) =>
			rule.id === id ? { ...rule, ...updates } : rule
		);
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
		return !['isEmpty', 'isNotEmpty'].includes(operator);
	}

	override render() {
		if (!this._data) return;
		return html`

			<uui-box class="uui-text">
				<umb-localize key="validation_conditional" slot="headline">Conditional</umb-localize>
				${this.#renderMandatory()}</uui-box
			>

		`;
	}

	#renderMandatory() {
		return html`<umb-property-layout orientation="vertical">
				<uui-toggle
					@change=${this.#onConditionalChange}
					id="mandatory"
					.checked=${this._data?.validation?.mandatory ?? false}
					slot="editor"
					><umb-localize key="validation_fieldIsConditional">Field is conditional</umb-localize></uui-toggle
				></umb-property-layout
			>

			${this._data?.validation?.mandatory
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
			{ value: 'equals', name: 'Equals' },
			{ value: 'notEquals', name: 'Does Not Equal' },
			{ value: 'contains', name: 'Contains' },
			{ value: 'notContains', name: 'Does Not Contain' },
			{ value: 'greaterThan', name: 'Greater Than' },
			{ value: 'lessThan', name: 'Less Than' },
			{ value: 'isEmpty', name: 'Is Empty' },
			{ value: 'isNotEmpty', name: 'Is Not Empty' },
		];
		
		const groupingOperators: Array<{ value: LogicalOperator; name: string }> = [
			{ value: 'or', name: 'Or' },
			{ value: 'and', name: 'And' }
		];

		return html`
			${index > 0
				? html`
					<div class="logical-operator-row">
						<uui-select
							.value=${rule.logicalOperator || 'and'}
							@change=${(e: UUISelectEvent) => this.#onLogicalOperatorChange(rule.id, e)}
							label="Logical Operator"
							.options=${groupingOperators}
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
							.options=${this._availableFields}>
						</uui-select>
					</div>

					<div class="rule-field">
						<label>Condition</label>
						<uui-select
							@change=${(e: UUISelectEvent) => this.#onOperatorChange(rule.id, e)}
							label="Operator"
							.options=${operators}>
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
		`,
	];
}

export default CndFldsPropertyTypeWorkspaceViewSettingsElement;

declare global {
	interface HTMLElementTagNameMap {
		'cndfld-property-type-workspace-view-settings': CndFldsPropertyTypeWorkspaceViewSettingsElement;
	}
}
