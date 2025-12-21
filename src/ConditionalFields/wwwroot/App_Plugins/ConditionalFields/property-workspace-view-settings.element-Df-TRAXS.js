import { UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT as N } from "@umbraco-cms/backoffice/property-type";
import { UMB_DOCUMENT_TYPE_WORKSPACE_CONTEXT as W } from "@umbraco-cms/backoffice/document-type";
import { html as u, css as I, state as d, customElement as M } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as q } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as L } from "@umbraco-cms/backoffice/style";
var B = Object.defineProperty, Y = Object.getOwnPropertyDescriptor, E = (e) => {
  throw TypeError(e);
}, c = (e, i, o, l) => {
  for (var n = l > 1 ? void 0 : l ? Y(i, o) : i, h = e.length - 1, r; h >= 0; h--)
    (r = e[h]) && (n = (l ? r(i, o, n) : r(n)) || n);
  return l && n && B(i, o, n), n;
}, C = (e, i, o) => i.has(e) || E("Cannot " + o), _ = (e, i, o) => (C(e, i, "read from private field"), i.get(e)), y = (e, i, o) => i.has(e) ? E("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(e) : i.set(e, o), x = (e, i, o, l) => (C(e, i, "write to private field"), i.set(e, o), o), a = (e, i, o) => (C(e, i, "access private method"), o), g, v, t, m, w, f, $, P, R, p, T, k, b, z, O, S, A, U, F, V, D, K;
let s = class extends q {
  constructor() {
    super(), y(this, t), y(this, g), y(this, v), this._conditionalRules = [], this._availableFields = [], this._isConditional = !1, this._isSaving = !1, this.consumeContext(N, (e) => {
      x(this, g, e), this.observe(e?.data, (i) => {
        this._data = i, this._currentPropertyAlias = i?.alias, this._currentPropertyKey = i?.id || i?.key, a(this, t, m).call(this), a(this, t, w).call(this);
      }, "observeData");
    }), this.consumeContext(W, (e) => {
      x(this, v, e), this.observe(
        e?.structure.contentTypeProperties,
        () => {
          a(this, t, m).call(this);
        },
        "observeContentTypeProperties"
      );
    }).passContextAliasMatches();
  }
  updateValue(e) {
    _(this, g)?.updateData(e);
  }
  render() {
    if (this._data)
      return u`

			<uui-box class="uui-text">
				<umb-localize key="validation_conditional" slot="headline">Conditional</umb-localize>
				${a(this, t, V).call(this)}</uui-box
			>

		`;
  }
};
g = /* @__PURE__ */ new WeakMap();
v = /* @__PURE__ */ new WeakMap();
t = /* @__PURE__ */ new WeakSet();
m = async function() {
  if (!_(this, v)) {
    console.warn("Document type context not available yet");
    return;
  }
  try {
    const e = await _(this, v).structure.getContentTypeProperties();
    this._availableFields = e.filter((i) => i.alias !== this._currentPropertyAlias).map((i) => ({
      value: i.alias ?? "",
      name: `${i.name} (${i.alias})`,
      editorUiAlias: i.propertyEditorUiAlias || i.editorUiAlias,
      dataType: i.dataType,
      config: i.config
    })).sort((i, o) => i.name.localeCompare(o.name)), console.log("Loaded available fields with editor info:", this._availableFields);
  } catch (e) {
    console.error("Error loading available fields:", e), this._availableFields = [];
  }
};
w = async function() {
  if (console.log("loading", this._currentPropertyKey), !!this._currentPropertyKey)
    try {
      const e = await fetch(`/umbraco/management/api/v1/conditionalfields/${this._currentPropertyKey}`);
      if (e.ok) {
        const i = await e.json();
        this._isConditional = i.isConditional ?? !1, this._conditionalRules = i.rules ?? [];
      }
    } catch (e) {
      console.error("Error loading conditional configuration:", e);
    }
};
f = async function() {
  if (!this._currentPropertyKey) {
    console.error("Cannot save: property key not available");
    return;
  }
  if (!this._isSaving) {
    this._isSaving = !0;
    try {
      const e = {
        isConditional: this._isConditional,
        rules: this._conditionalRules
      }, i = await fetch(`/umbraco/management/api/v1/conditionalfields/${this._currentPropertyKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(e)
      });
      i.ok ? console.log("Configuration saved successfully") : console.error("Failed to save configuration:", await i.text());
    } catch (e) {
      console.error("Error saving conditional configuration:", e);
    } finally {
      this._isSaving = !1;
    }
  }
};
$ = function(e) {
  this._isConditional = e.target.checked, this._isConditional || (this._conditionalRules = []), a(this, t, f).call(this);
};
P = function() {
  const e = {
    id: crypto.randomUUID(),
    fieldAlias: "",
    operator: "equals",
    value: "",
    logicalOperator: this._conditionalRules.length > 0 ? "and" : void 0
  };
  this._conditionalRules = [...this._conditionalRules, e], a(this, t, f).call(this);
};
R = function(e) {
  this._conditionalRules = this._conditionalRules.filter((i) => i.id !== e), this._conditionalRules.length > 0 && (this._conditionalRules[0] = { ...this._conditionalRules[0], logicalOperator: void 0 }), a(this, t, f).call(this);
};
p = function(e, i) {
  this._conditionalRules = this._conditionalRules.map(
    (o) => o.id === e ? { ...o, ...i } : o
  ), a(this, t, f).call(this);
};
T = function(e, i) {
  a(this, t, p).call(this, e, { fieldAlias: i.target.value });
};
k = function(e, i) {
  a(this, t, p).call(this, e, { operator: i.target.value });
};
b = function(e, i) {
  a(this, t, p).call(this, e, { value: i.target.value.toString() });
};
z = function(e, i) {
  a(this, t, p).call(this, e, { logicalOperator: i.target.value });
};
O = function(e) {
  return !["isEmpty", "isNotEmpty"].includes(e);
};
S = function(e) {
  return this._availableFields.find((i) => i.value === e);
};
A = function(e, i) {
  a(this, t, p).call(this, e, { value: i.target.checked ? "true" : "false" });
};
U = function(e, i) {
  a(this, t, p).call(this, e, { value: i.target.value.toString() });
};
F = function(e) {
  const i = a(this, t, S).call(this, e.fieldAlias), o = i?.editorUiAlias;
  if (o === "Umb.PropertyEditorUi.Toggle")
    return u`
				<div class="rule-field">
					<label>Value</label>
					<uui-toggle
						.checked=${e.value === "true" || e.value === "1"}
						@change=${(l) => a(this, t, A).call(this, e.id, l)}
						label="Value">
						<span slot="label">${e.value === "true" || e.value === "1" ? "True" : "False"}</span>
					</uui-toggle>
				</div>
			`;
  if (o === "Umb.PropertyEditorUi.Dropdown") {
    const h = ((i?.config || {}).items || []).map((r) => ({
      value: r.value || r.id || r,
      name: r.name || r.label || r.value || r
    }));
    return u`
				<div class="rule-field">
					<label>Value</label>
					<uui-select
						.value=${e.value}
						@change=${(r) => a(this, t, U).call(this, e.id, r)}
						placeholder="Select a value"
						label="Value"
						.options=${h}>
					</uui-select>
				</div>
			`;
  }
  return o === "Umb.PropertyEditorUi.Integer" || o === "Umb.PropertyEditorUi.Decimal" ? u`
				<div class="rule-field">
					<label>Value</label>
					<uui-input
						type="number"
						.value=${e.value}
						@input=${(l) => a(this, t, b).call(this, e.id, l)}
						placeholder="Enter number"
						label="Value">
					</uui-input>
				</div>
			` : u`
			<div class="rule-field">
				<label>Value</label>
				<uui-input
					.value=${e.value}
					@input=${(l) => a(this, t, b).call(this, e.id, l)}
					placeholder="Enter value"
					label="Value">
				</uui-input>
			</div>
		`;
};
V = function() {
  return u`<umb-property-layout orientation="vertical">
				<uui-toggle
					@change=${a(this, t, $)}
					id="conditional"
					.checked=${this._isConditional}
					slot="editor"
					><umb-localize key="validation_fieldIsConditional">Field is conditional</umb-localize></uui-toggle
				></umb-property-layout
			>

			${this._isConditional ? u`
					${a(this, t, D).call(this)}
					` : ""} `;
};
D = function() {
  return u`
			<div class="conditionals-section">
				<umb-property-layout orientation="vertical">
					<div slot="editor" class="conditionals-container">
						${this._conditionalRules.map((e, i) => a(this, t, K).call(this, e, i))}

						<uui-button
							look="placeholder"
							label="Add Conditional"
							@click=${a(this, t, P)}
							color="default">
							<uui-icon name="icon-add"></uui-icon>
							Add Conditional Rule
						</uui-button>
					</div>
				</umb-property-layout>
			</div>
		`;
};
K = function(e, i) {
  const o = [
    { value: "equals", name: "Equals" },
    { value: "notEquals", name: "Does Not Equal" },
    { value: "contains", name: "Contains" },
    { value: "notContains", name: "Does Not Contain" },
    { value: "greaterThan", name: "Greater Than" },
    { value: "lessThan", name: "Less Than" },
    { value: "isEmpty", name: "Is Empty" },
    { value: "isNotEmpty", name: "Is Not Empty" }
  ], l = [
    { value: "or", name: "Or" },
    { value: "and", name: "And" }
  ];
  return u`
			${i > 0 ? u`
					<div class="logical-operator-row">
						<uui-select
							.value=${e.logicalOperator || "and"}
							@change=${(n) => a(this, t, z).call(this, e.id, n)}
							label="Logical Operator"
							.options=${l}
							>
						</uui-select>
					</div>
				` : ""}

			<div class="conditional-rule">
				<div class="rule-fields">
					<div class="rule-field">
						<label>Field</label>
						<uui-select
							.value=${e.fieldAlias}
							@change=${(n) => a(this, t, T).call(this, e.id, n)}
							placeholder="Select a field"
							label="Field"
							.options=${this._availableFields}>
						</uui-select>
					</div>

					<div class="rule-field">
						<label>Condition</label>
						<uui-select
							.value=${e.operator}
							@change=${(n) => a(this, t, k).call(this, e.id, n)}
							label="Operator"
							.options=${o}>
						</uui-select>
					</div>

					${a(this, t, O).call(this, e.operator) ? a(this, t, F).call(this, e) : ""}
				</div>

				<uui-button
					look="primary"
					color="danger"
					compact
					@click=${() => a(this, t, R).call(this, e.id)}
					label="Remove rule">
					<uui-icon name="icon-delete"></uui-icon>
				</uui-button>
			</div>
		`;
};
s.styles = [
  L,
  I`
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
		`
];
c([
  d()
], s.prototype, "_data", 2);
c([
  d()
], s.prototype, "_conditionalRules", 2);
c([
  d()
], s.prototype, "_availableFields", 2);
c([
  d()
], s.prototype, "_currentPropertyAlias", 2);
c([
  d()
], s.prototype, "_currentPropertyKey", 2);
c([
  d()
], s.prototype, "_isConditional", 2);
c([
  d()
], s.prototype, "_isSaving", 2);
s = c([
  M("cndflds-property-type-workspace-view-settings")
], s);
const Q = s;
export {
  s as CndFldsPropertyTypeWorkspaceViewSettingsElement,
  Q as default
};
//# sourceMappingURL=property-workspace-view-settings.element-Df-TRAXS.js.map
