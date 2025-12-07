import { UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT as g } from "@umbraco-cms/backoffice/property-type";
import { html as p, css as b, state as x, customElement as w } from "@umbraco-cms/backoffice/external/lit";
import { UMB_VALIDATION_EMPTY_LOCALIZATION_KEY as z } from "@umbraco-cms/backoffice/validation";
import { UmbLitElement as C } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as E } from "@umbraco-cms/backoffice/style";
var P = Object.defineProperty, T = Object.getOwnPropertyDescriptor, y = (e) => {
  throw TypeError(e);
}, m = (e, a, t, i) => {
  for (var o = i > 1 ? void 0 : i ? T(a, t) : a, l = e.length - 1, d; l >= 0; l--)
    (d = e[l]) && (o = (i ? d(a, t, o) : d(o)) || o);
  return i && o && P(a, t, o), o;
}, c = (e, a, t) => a.has(e) || y("Cannot " + t), M = (e, a, t) => (c(e, a, "read from private field"), a.get(e)), v = (e, a, t) => a.has(e) ? y("Cannot add the same private member more than once") : a instanceof WeakSet ? a.add(e) : a.set(e, t), O = (e, a, t, i) => (c(e, a, "write to private field"), a.set(e, t), t), u = (e, a, t) => (c(e, a, "access private method"), t), s, r, h, _, f;
let n = class extends C {
  constructor() {
    super(), v(this, r), v(this, s), console.log("out"), this.consumeContext(g, (e) => {
      O(this, s, e), this.observe(e?.data, (a) => this._data = a, "observeData");
    });
  }
  updateValue(e) {
    M(this, s)?.updateData(e);
  }
  render() {
    if (this._data)
      return p`

			<uui-box class="uui-text">
				<umb-localize key="validation_conditional" slot="headline">Conditional</umb-localize>
				${u(this, r, f).call(this)}</uui-box
			>

		`;
  }
};
s = /* @__PURE__ */ new WeakMap();
r = /* @__PURE__ */ new WeakSet();
h = function(e) {
  const a = e.target.checked;
  this.updateValue({
    validation: { ...this._data?.validation, mandatory: a }
  });
};
_ = function(e) {
  const a = e.target.value.toString();
  this.updateValue({
    validation: { ...this._data?.validation, mandatory: this._data?.validation.mandatory ?? !1, mandatoryMessage: a }
  });
};
f = function() {
  return p`<umb-property-layout orientation="vertical">
				<uui-toggle
					@change=${u(this, r, h)}
					id="mandatory"
					.checked=${this._data?.validation?.mandatory ?? !1}
					slot="editor"
					><umb-localize key="validation_fieldIsConditional">Field is conditional</umb-localize></uui-toggle
				></umb-property-layout
			>

			${this._data?.validation?.mandatory ? p`<umb-property-layout label="#validation_mandatoryMessageLabel" orientation="vertical"
						><uui-input
							name="mandatory-message"
							slot="editor"
							value=${this._data.validation?.mandatoryMessage ?? ""}
							@change=${u(this, r, _)}
							style="margin-top: var(--uui-size-space-1)"
							id="mandatory-message"
							placeholder=${this.localize.string(z)}
							label=${this.localize.term("validation_mandatoryMessage")}></uui-input
					></umb-property-layout>
					<!-- INSERT GROUP HERE -->
					
					` : ""} `;
};
n.styles = [
  E,
  b`
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
		`
];
m([
  x()
], n.prototype, "_data", 2);
n = m([
  w("cndflds-property-type-workspace-view-settings")
], n);
const A = n;
export {
  n as CndFldsPropertyTypeWorkspaceViewSettingsElement,
  A as default
};
//# sourceMappingURL=property-workspace-view-settings.element-D53v-UbM.js.map
