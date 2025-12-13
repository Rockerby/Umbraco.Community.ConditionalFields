import { UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT as M } from "@umbraco-cms/backoffice/property-type";
import { UMB_DOCUMENT_TYPE_WORKSPACE_CONTEXT as I } from "@umbraco-cms/backoffice/document-type";
import { html as l, css as U, state as c, customElement as V } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as q } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as L } from "@umbraco-cms/backoffice/style";
import { U as B, C as z } from "./document-conditional-workspace.context-Bg7y4rFl.js";
var G = Object.defineProperty, X = Object.getOwnPropertyDescriptor, E = (e) => {
  throw TypeError(e);
}, s = (e, i, a, u) => {
  for (var n = u > 1 ? void 0 : u ? X(i, a) : i, _ = e.length - 1, m; _ >= 0; _--)
    (m = e[_]) && (n = (u ? m(i, a, n) : m(n)) || n);
  return u && n && G(i, a, n), n;
}, x = (e, i, a) => i.has(e) || E("Cannot " + a), d = (e, i, a) => (x(e, i, "read from private field"), i.get(e)), g = (e, i, a) => i.has(e) ? E("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(e) : i.set(e, a), b = (e, i, a, u) => (x(e, i, "write to private field"), i.set(e, a), a), o = (e, i, a) => (x(e, i, "access private method"), a), y, p, h, t, C, P, w, f, R, T, $, v, F, O, k, A, S, D, K, N, W;
let r = class extends q {
  constructor() {
    super(), g(this, t), g(this, y), g(this, p), g(this, h), this._conditionalRules = [], this._availableFields = [], this._isConditional = !1, this._isSaving = !1, this._dependentFields = [], this.consumeContext(M, (e) => {
      b(this, y, e), this.observe(e?.data, (i) => {
        this._data = i, this._currentPropertyAlias = i?.alias, this._currentPropertyKey = i?.unique, o(this, t, C).call(this), o(this, t, P).call(this);
      }, "observeData");
    }), this.consumeContext(I, (e) => {
      b(this, p, e), this.observe(
        e?.structure.contentTypeProperties,
        () => {
          o(this, t, C).call(this);
        },
        "observeContentTypeProperties"
      );
    }).passContextAliasMatches();
    try {
      this.consumeContext(B, (e) => {
        b(this, h, e), o(this, t, w).call(this);
      });
    } catch {
    }
  }
  updateValue(e) {
    d(this, y)?.updateData(e);
  }
  render() {
    if (this._data)
      return l`
			${o(this, t, D).call(this)}

			<uui-box class="uui-text">
				<umb-localize key="validation_conditional" slot="headline">Conditional</umb-localize>
				${o(this, t, K).call(this)}</uui-box
			>

		`;
  }
};
y = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
h = /* @__PURE__ */ new WeakMap();
t = /* @__PURE__ */ new WeakSet();
C = async function() {
  if (!d(this, p)) {
    console.warn("Document type context not available yet");
    return;
  }
  try {
    const e = await d(this, p).structure.getContentTypeProperties();
    this._availableFields = e.filter((i) => i.alias !== this._currentPropertyAlias).map((i) => ({
      value: i.alias ?? "",
      name: `${i.name} (${i.alias})`
    })).sort((i, a) => i.name.localeCompare(a.name));
  } catch (e) {
    console.error("Error loading available fields:", e), this._availableFields = [];
  }
};
P = async function() {
  if (this._currentPropertyKey) {
    try {
      const { data: i, error: a } = await z.getConfiguration({
        path: {
          propertyTypeKey: this._currentPropertyKey
        }
      });
      var e = this._currentPropertyKey;
      console.log("Loaded configuration", { propKey: e, data: i, error: a }), i ? (this._isConditional = i.isConditional ?? !1, this._conditionalRules = i.rules ?? []) : a && console.error("Error loading conditional configuration:", a);
    } catch (i) {
      console.error("Error loading conditional configuration:", i);
    }
    o(this, t, w).call(this);
  }
};
w = function() {
  if (!this._currentPropertyKey || !d(this, h)) {
    this._dependentFields = [];
    return;
  }
  try {
    this._dependentFields = d(this, h).getDependenciesFor(this._currentPropertyKey);
  } catch (e) {
    console.error("Error loading dependencies:", e), this._dependentFields = [];
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
      const { error: e } = await z.saveConfiguration({
        path: {
          propertyTypeKey: this._currentPropertyKey
        },
        body: {
          isConditional: this._isConditional,
          rules: this._conditionalRules
        }
      });
      e && console.error("Failed to save configuration:", e);
    } catch (e) {
      console.error("Error saving conditional configuration:", e);
    } finally {
      this._isSaving = !1;
    }
  }
};
R = function(e) {
  this._isConditional = e.target.checked, this._isConditional || (this._conditionalRules = []), o(this, t, f).call(this);
};
T = function() {
  const e = {
    id: crypto.randomUUID(),
    fieldAlias: "",
    operator: "Equals",
    value: "",
    logicalOperator: (this._conditionalRules.length > 0, "And")
  };
  this._conditionalRules = [...this._conditionalRules, e], o(this, t, f).call(this);
};
$ = function(e) {
  this._conditionalRules = this._conditionalRules.filter((i) => i.id !== e), this._conditionalRules.length > 0 && (this._conditionalRules[0] = { ...this._conditionalRules[0], logicalOperator: "And" }), o(this, t, f).call(this);
};
v = function(e, i) {
  this._conditionalRules = this._conditionalRules.map(
    (a) => a.id === e ? { ...a, ...i } : a
  ), o(this, t, f).call(this);
};
F = function(e, i) {
  o(this, t, v).call(this, e, { fieldAlias: i.target.value });
};
O = function(e, i) {
  o(this, t, v).call(this, e, { operator: i.target.value });
};
k = function(e, i) {
  o(this, t, v).call(this, e, { value: i.target.value.toString() });
};
A = function(e, i) {
  o(this, t, v).call(this, e, { logicalOperator: i.target.value });
};
S = function(e) {
  return !["IsEmpty", "IsNotEmpty"].includes(e);
};
D = function() {
  return !this._dependentFields || this._dependentFields.length === 0 ? "" : l`
			<uui-box class="dependency-warning">
				<div class="warning-content">
					<div class="warning-header">
						<uui-icon name="icon-alert"></uui-icon>
						<strong>Dependency Warning</strong>
					</div>
					<p>
						${this._dependentFields.length === 1 ? l`<strong>1 other field</strong> depends on this field:` : l`<strong>${this._dependentFields.length} other fields</strong> depend on this field:`}
					</p>
					<ul class="dependency-list">
						${this._dependentFields.map(
    (e) => l`<li>${e.name} <span class="field-alias">(${e.alias})</span></li>`
  )}
					</ul>
					<p class="warning-note">
						Changes to this field's configuration may affect the visibility of these dependent fields.
					</p>
				</div>
			</uui-box>
		`;
};
K = function() {
  return l`<umb-property-layout orientation="vertical">
				<uui-toggle
					@change=${o(this, t, R)}
					id="conditional"
					.checked=${this._isConditional}
					slot="editor"
					><umb-localize key="validation_fieldIsConditional">Field is conditional</umb-localize></uui-toggle
				></umb-property-layout
			>

			${this._isConditional ? l`
					${o(this, t, N).call(this)}
					` : ""} `;
};
N = function() {
  return l`
			<div class="conditionals-section">
				<umb-property-layout orientation="vertical">
					<div slot="editor" class="conditionals-container">
						${this._conditionalRules.map((e, i) => o(this, t, W).call(this, e, i))}

						<uui-button
							look="placeholder"
							label="Add Conditional"
							@click=${o(this, t, T)}
							color="default">
							<uui-icon name="icon-add"></uui-icon>
							Add Conditional Rule
						</uui-button>
					</div>
				</umb-property-layout>
			</div>
		`;
};
W = function(e, i) {
  const a = [
    { value: "Equals", name: "Equals" },
    { value: "NotEquals", name: "Does Not Equal" },
    { value: "Contains", name: "Contains" },
    { value: "NotContains", name: "Does Not Contain" },
    { value: "GreaterThan", name: "Greater Than" },
    { value: "LessThan", name: "Less Than" },
    { value: "IsEmpty", name: "Is Empty" },
    { value: "IsNotEmpty", name: "Is Not Empty" }
  ], u = [
    { value: "Or", name: "Or" },
    { value: "And", name: "And" }
  ];
  return l`
			${i > 0 ? l`
					<div class="logical-operator-row">
						<uui-select
							.value=${e.logicalOperator || "And"}
							@change=${(n) => o(this, t, A).call(this, e.id, n)}
							label="Logical Operator"
							.options=${u}
							>
						</uui-select>
					</div>
				` : ""}

			<div class="conditional-rule">
				<div class="rule-fields">
					<div class="rule-field">
						<label>Field</label>
						<uui-select
							@change=${(n) => o(this, t, F).call(this, e.id, n)}
							placeholder="Select a field"
							label="Field"
							.options=${this._availableFields}>
						</uui-select>
					</div>

					<div class="rule-field">
						<label>Condition</label>
						<uui-select
							@change=${(n) => o(this, t, O).call(this, e.id, n)}
							label="Operator"
							.options=${a}>
						</uui-select>
					</div>

					${o(this, t, S).call(this, e.operator) ? l`
							<div class="rule-field">
								<label>Value</label>
								<uui-input
									.value=${e.value}
									@input=${(n) => o(this, t, k).call(this, e.id, n)}
									placeholder="Enter value"
									label="Value">
								</uui-input>
							</div>
						` : ""}
				</div>

				<uui-button
					look="primary"
					color="danger"
					compact
					@click=${() => o(this, t, $).call(this, e.id)}
					label="Remove rule">
					<uui-icon name="icon-delete"></uui-icon>
				</uui-button>
			</div>
		`;
};
r.styles = [
  L,
  U`
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
		`
];
s([
  c()
], r.prototype, "_data", 2);
s([
  c()
], r.prototype, "_conditionalRules", 2);
s([
  c()
], r.prototype, "_availableFields", 2);
s([
  c()
], r.prototype, "_currentPropertyAlias", 2);
s([
  c()
], r.prototype, "_currentPropertyKey", 2);
s([
  c()
], r.prototype, "_isConditional", 2);
s([
  c()
], r.prototype, "_isSaving", 2);
s([
  c()
], r.prototype, "_dependentFields", 2);
r = s([
  V("cndflds-property-type-workspace-view-settings")
], r);
const ee = r;
export {
  r as CndFldsPropertyTypeWorkspaceViewSettingsElement,
  ee as default
};
//# sourceMappingURL=property-workspace-view-settings.element-Q5IRGa5S.js.map
