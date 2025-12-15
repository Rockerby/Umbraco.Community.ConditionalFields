import { UMB_PROPERTY_TYPE_WORKSPACE_CONTEXT as M } from "@umbraco-cms/backoffice/property-type";
import { UMB_DOCUMENT_TYPE_WORKSPACE_CONTEXT as U } from "@umbraco-cms/backoffice/document-type";
import { html as s, css as q, state as c, customElement as V } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement as L } from "@umbraco-cms/backoffice/lit-element";
import { UmbTextStyles as B } from "@umbraco-cms/backoffice/style";
import { U as G, C as z } from "./document-conditional-workspace.context-BvrHaWXi.js";
var X = Object.defineProperty, Y = Object.getOwnPropertyDescriptor, E = (e) => {
  throw TypeError(e);
}, l = (e, i, t, u) => {
  for (var a = u > 1 ? void 0 : u ? Y(i, t) : i, m = e.length - 1, b; m >= 0; m--)
    (b = e[m]) && (a = (u ? b(i, t, a) : b(a)) || a);
  return u && a && X(i, t, a), a;
}, x = (e, i, t) => i.has(e) || E("Cannot " + t), d = (e, i, t) => (x(e, i, "read from private field"), i.get(e)), h = (e, i, t) => i.has(e) ? E("Cannot add the same private member more than once") : i instanceof WeakSet ? i.add(e) : i.set(e, t), f = (e, i, t, u) => (x(e, i, "write to private field"), i.set(e, t), t), n = (e, i, t) => (x(e, i, "access private method"), t), _, v, y, p, o, C, R, P, w, T, O, $, g, D, F, k, A, S, K, N, W, I;
let r = class extends L {
  constructor() {
    super(), h(this, o), h(this, _), h(this, v), h(this, y), this._conditionalRules = [], this._availableFields = [], this._isConditional = !1, this._isSaving = !1, this._dependentFields = [], this._isDirty = !1, h(this, p), this.consumeContext(M, (e) => {
      f(this, _, e), this.observe(e?.data, (i) => {
        d(this, p) && d(this, p) !== i?.unique && this._isDirty && (console.log("[ConditionalProperties] Switching properties, saving previous configuration"), n(this, o, w).call(this)), this._data = i, this._currentPropertyAlias = i?.alias, this._currentPropertyKey = i?.unique, n(this, o, C).call(this), n(this, o, R).call(this);
      }, "observeData"), this.observe(e?.isNew, (i) => {
        i === !1 && this._isDirty && (console.log("[ConditionalProperties] Workspace saved, persisting configuration"), n(this, o, w).call(this));
      }, "observeIsNew");
    }), this.consumeContext(U, (e) => {
      f(this, v, e), this.observe(
        e?.structure.contentTypeProperties,
        () => {
          n(this, o, C).call(this);
        },
        "observeContentTypeProperties"
      );
    }).passContextAliasMatches();
    try {
      this.consumeContext(G, (e) => {
        f(this, y, e), n(this, o, P).call(this);
      });
    } catch {
    }
  }
  updateValue(e) {
    d(this, _)?.updateData(e);
  }
  render() {
    if (this._data)
      return s`
			${n(this, o, K).call(this)}

			<uui-box class="uui-text">
				<umb-localize key="validation_conditional" slot="headline">Conditional</umb-localize>
				${n(this, o, N).call(this)}</uui-box
			>

		`;
  }
};
_ = /* @__PURE__ */ new WeakMap();
v = /* @__PURE__ */ new WeakMap();
y = /* @__PURE__ */ new WeakMap();
p = /* @__PURE__ */ new WeakMap();
o = /* @__PURE__ */ new WeakSet();
C = async function() {
  if (!d(this, v)) {
    console.warn("Document type context not available yet");
    return;
  }
  try {
    const e = await d(this, v).structure.getContentTypeProperties();
    this._availableFields = e.filter((i) => i.alias !== this._currentPropertyAlias).map((i) => ({
      value: i.alias ?? "",
      name: `${i.name} (${i.alias})`,
      selected: !1
    })).sort((i, t) => i.name.localeCompare(t.name));
  } catch (e) {
    console.error("Error loading available fields:", e), this._availableFields = [];
  }
};
R = async function() {
  if (this._currentPropertyKey) {
    try {
      const { data: i, error: t } = await z.getConfiguration({
        path: {
          propertyTypeKey: this._currentPropertyKey
        }
      });
      var e = this._currentPropertyKey;
      console.log("Loaded configuration", { propKey: e, data: i, error: t }), i ? (this._isConditional = i.isConditional ?? !1, this._conditionalRules = i.rules ?? [], this._isDirty = !1, f(this, p, this._currentPropertyKey)) : t && console.error("Error loading conditional configuration:", t);
    } catch (i) {
      console.error("Error loading conditional configuration:", i);
    }
    n(this, o, P).call(this);
  }
};
P = function() {
  if (!this._currentPropertyKey || !d(this, y)) {
    this._dependentFields = [];
    return;
  }
  try {
    this._dependentFields = d(this, y).getDependenciesFor(this._currentPropertyKey);
  } catch (e) {
    console.error("Error loading dependencies:", e), this._dependentFields = [];
  }
};
w = async function() {
  if (!this._currentPropertyKey) {
    console.error("Cannot save: property key not available");
    return;
  }
  if (!this._isSaving) {
    this._isSaving = !0;
    try {
      console.log("[ConditionalProperties] Saving configuration...");
      const { error: e } = await z.saveConfiguration({
        path: {
          propertyTypeKey: this._currentPropertyKey
        },
        body: {
          isConditional: this._isConditional,
          rules: this._conditionalRules
        }
      });
      e ? console.error("Failed to save configuration:", e) : (console.log("[ConditionalProperties] Configuration saved successfully"), this._isDirty = !1, f(this, p, this._currentPropertyKey));
    } catch (e) {
      console.error("Error saving conditional configuration:", e);
    } finally {
      this._isSaving = !1;
    }
  }
};
T = function(e) {
  this._isConditional = e.target.checked, this._isConditional || (this._conditionalRules = []), this._isDirty = !0;
};
O = function() {
  const e = {
    id: crypto.randomUUID(),
    fieldAlias: "",
    operator: "Equals",
    value: "",
    logicalOperator: (this._conditionalRules.length > 0, "And")
  };
  this._conditionalRules = [...this._conditionalRules, e], this._isDirty = !0;
};
$ = function(e) {
  confirm("Are you sure you want to remove this rule?") && (this._conditionalRules = this._conditionalRules.filter((i) => i.id !== e), this._conditionalRules.length > 0 && (this._conditionalRules[0] = { ...this._conditionalRules[0], logicalOperator: "And" }), this._isDirty = !0);
};
g = function(e, i) {
  this._conditionalRules = this._conditionalRules.map(
    (t) => t.id === e ? { ...t, ...i } : t
  ), this._isDirty = !0;
};
D = function(e, i) {
  n(this, o, g).call(this, e, { fieldAlias: i.target.value });
};
F = function(e, i) {
  n(this, o, g).call(this, e, { operator: i.target.value });
};
k = function(e, i) {
  n(this, o, g).call(this, e, { value: i.target.value.toString() });
};
A = function(e, i) {
  n(this, o, g).call(this, e, { logicalOperator: i.target.value });
};
S = function(e) {
  return !["IsEmpty", "IsNotEmpty"].includes(e);
};
K = function() {
  return !this._dependentFields || this._dependentFields.length === 0 ? "" : s`
			<uui-box class="dependency-warning">
				<div class="warning-content">
					<div class="warning-header">
						<uui-icon name="icon-alert"></uui-icon>
						<strong>Dependency Warning</strong>
					</div>
					<p>
						${this._dependentFields.length === 1 ? s`<strong>1 other field</strong> depends on this field:` : s`<strong>${this._dependentFields.length} other fields</strong> depend on this field:`}
					</p>
					<ul class="dependency-list">
						${this._dependentFields.map(
    (e) => s`<li>${e.name} <span class="field-alias">(${e.alias})</span></li>`
  )}
					</ul>
					<p class="warning-note">
						Changes to this field's configuration may affect the visibility of these dependent fields.
					</p>
				</div>
			</uui-box>
		`;
};
N = function() {
  return s`<umb-property-layout orientation="vertical">
				<uui-toggle
					@change=${n(this, o, T)}
					id="conditional"
					.checked=${this._isConditional}
					slot="editor"
					><umb-localize key="validation_fieldIsConditional">Field is conditional</umb-localize></uui-toggle
				></umb-property-layout
			>

			${this._isConditional ? s`
					${n(this, o, W).call(this)}
					` : ""} `;
};
W = function() {
  return s`
			<div class="conditionals-section">
				<umb-property-layout orientation="vertical">
					<div slot="editor" class="conditionals-container">
						${this._conditionalRules.map((e, i) => n(this, o, I).call(this, e, i))}

						<uui-button
							look="placeholder"
							label="Add Conditional"
							@click=${n(this, o, O)}
							color="default">
							<uui-icon name="icon-add"></uui-icon>
							Add Conditional Rule
						</uui-button>
					</div>
				</umb-property-layout>
			</div>
		`;
};
I = function(e, i) {
  const t = [
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
  return s`
			${i > 0 ? s`
					<div class="logical-operator-row">
						<uui-select
							.value=${e.logicalOperator || "And"}
							@change=${(a) => n(this, o, A).call(this, e.id, a)}
							label="Logical Operator"
							.options=${u.map((a) => ({
    ...a,
    selected: a.value === e.logicalOperator
  }))}
							>
						</uui-select>
					</div>
				` : ""}

			<div class="conditional-rule">
				<div class="rule-fields">
					<div class="rule-field">
						<label>Field</label>
						<uui-select
							@change=${(a) => n(this, o, D).call(this, e.id, a)}
							placeholder="Select a field"
							label="Field"
							.options=${this._availableFields.map((a) => ({
    ...a,
    selected: a.value === e.fieldAlias
  }))}>
						</uui-select>
					</div>

					<div class="rule-field">
						<label>Condition</label>
						<uui-select
							@change=${(a) => n(this, o, F).call(this, e.id, a)}
							label="Operator"
							.options=${t.map((a) => ({
    ...a,
    selected: a.value === e.operator
  }))}>
						</uui-select>
					</div>

					${n(this, o, S).call(this, e.operator) ? s`
							<div class="rule-field">
								<label>Value</label>
								<uui-input
									.value=${e.value}
									@input=${(a) => n(this, o, k).call(this, e.id, a)}
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
					@click=${() => n(this, o, $).call(this, e.id)}
					label="Remove rule">
					<uui-icon name="icon-delete"></uui-icon>
				</uui-button>
			</div>
		`;
};
r.styles = [
  B,
  q`
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
l([
  c()
], r.prototype, "_data", 2);
l([
  c()
], r.prototype, "_conditionalRules", 2);
l([
  c()
], r.prototype, "_availableFields", 2);
l([
  c()
], r.prototype, "_currentPropertyAlias", 2);
l([
  c()
], r.prototype, "_currentPropertyKey", 2);
l([
  c()
], r.prototype, "_isConditional", 2);
l([
  c()
], r.prototype, "_isSaving", 2);
l([
  c()
], r.prototype, "_dependentFields", 2);
l([
  c()
], r.prototype, "_isDirty", 2);
r = l([
  V("cndflds-property-type-workspace-view-settings")
], r);
const ie = r;
export {
  r as CndFldsPropertyTypeWorkspaceViewSettingsElement,
  ie as default
};
//# sourceMappingURL=property-workspace-view-settings.element-CMQkz44V.js.map
