import { UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/property-type';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import { UMB_VALIDATION_EMPTY_LOCALIZATION_KEY } from '@umbraco-cms/backoffice/validation';
import { UmbLitElement } from '@umbraco-cms/backoffice/lit-element';
import { UmbTextStyles } from '@umbraco-cms/backoffice/style';
import type { UmbPropertyTypeScaffoldModel } from '@umbraco-cms/backoffice/content-type';
import type { UmbWorkspaceViewElement } from '@umbraco-cms/backoffice/workspace';
import type { UUIBooleanInputEvent, UUIInputEvent/*, UUISelectEvent*/ } from '@umbraco-cms/backoffice/external/uui';

@customElement('cndflds-property-type-workspace-view-settings')
export class CndFldsPropertyTypeWorkspaceViewSettingsElement extends UmbLitElement implements UmbWorkspaceViewElement {
	#context?: typeof UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT.TYPE;

	@state()
	private _data?: UmbPropertyTypeScaffoldModel;

	constructor() {
		super();

		console.log("out");

		this.consumeContext(UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT, (instance) => {
			this.#context = instance;
			this.observe(instance?.data, (data) => (this._data = data), 'observeData');
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
				? html`<umb-property-layout label="#validation_mandatoryMessageLabel" orientation="vertical"
						><uui-input
							name="mandatory-message"
							slot="editor"
							value=${this._data.validation?.mandatoryMessage ?? ''}
							@change=${this.#onMandatoryMessageChange}
							style="margin-top: var(--uui-size-space-1)"
							id="mandatory-message"
							placeholder=${this.localize.string(UMB_VALIDATION_EMPTY_LOCALIZATION_KEY)}
							label=${this.localize.term('validation_mandatoryMessage')}></uui-input
					></umb-property-layout>
					<!-- INSERT GROUP HERE -->
					
					`
				: ''} `;
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
		`,
	];
}

export default CndFldsPropertyTypeWorkspaceViewSettingsElement;

declare global {
	interface HTMLElementTagNameMap {
		'cndfld-property-type-workspace-view-settings': CndFldsPropertyTypeWorkspaceViewSettingsElement;
	}
}
