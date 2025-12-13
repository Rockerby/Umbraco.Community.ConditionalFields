import { UmbContextBase as m } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as C } from "@umbraco-cms/backoffice/context-api";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as b } from "@umbraco-cms/backoffice/document";
import { UMB_PROPERTY_DATASET_CONTEXT as v } from "@umbraco-cms/backoffice/property";
import { c } from "./client.gen-D-YAh4px.js";
class l {
  /**
   * Evaluates a single conditional rule against a value
   * @param rule The conditional rule to evaluate
   * @param value The value to test against
   * @returns true if the rule passes, false otherwise
   */
  static evaluateRule(e, t) {
    const { operator: o, value: i } = e, n = String(t ?? "");
    switch (o) {
      case "Equals":
        return n === i;
      case "NotEquals":
        return n !== i;
      case "Contains":
        return n.includes(i);
      case "NotContains":
        return !n.includes(i);
      case "GreaterThan": {
        const s = Number(n), r = Number(i);
        return !isNaN(s) && !isNaN(r) && s > r;
      }
      case "LessThan": {
        const s = Number(n), r = Number(i);
        return !isNaN(s) && !isNaN(r) && s < r;
      }
      case "IsEmpty":
        return !n || n.length === 0;
      case "IsNotEmpty":
        return !!(n && n.length > 0);
      default:
        return console.warn(`Unknown operator: ${o}`), !1;
    }
  }
  /**
   * Evaluates multiple conditional rules with AND/OR logic
   * @param rules Array of conditional rules to evaluate
   * @param values Map of field aliases to their current values
   * @returns true if all rules pass (considering AND/OR logic), false otherwise
   */
  static evaluateRules(e, t) {
    if (!e || e.length === 0)
      return !0;
    let o = this.evaluateRule(e[0], t.get(e[0].fieldAlias));
    for (let i = 1; i < e.length; i++) {
      const n = e[i], s = this.evaluateRule(n, t.get(n.fieldAlias));
      n.logicalOperator === "Or" ? o = o || s : o = o && s;
    }
    return o;
  }
  /**
   * Gets all field aliases referenced in a set of rules
   * @param rules Array of conditional rules
   * @returns Set of unique field aliases
   */
  static getReferencedFields(e) {
    const t = /* @__PURE__ */ new Set();
    for (const o of e)
      o.fieldAlias && t.add(o.fieldAlias);
    return t;
  }
}
class w {
  static deleteConfiguration(e) {
    return (e.client ?? c).delete({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/conditionalfields/{propertyTypeKey}",
      ...e
    });
  }
  static getConfiguration(e) {
    return (e.client ?? c).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/conditionalfields/{propertyTypeKey}",
      ...e
    });
  }
  static saveConfiguration(e) {
    return (e.client ?? c).post({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/conditionalfields/{propertyTypeKey}",
      ...e,
      headers: {
        "Content-Type": "application/json",
        ...e.headers
      }
    });
  }
  static getAllConfigurations(e) {
    return (e?.client ?? c).get({
      security: [
        {
          scheme: "bearer",
          type: "http"
        }
      ],
      url: "/umbraco/management/api/v1/conditionalfields/all",
      ...e
    });
  }
}
const f = new C(
  "UmbDocumentConditionalWorkspaceContext",
  "CndFlds.WorkspaceContext.Document.Conditional"
);
class u extends m {
  #i;
  #n;
  // Map of property type key to configuration
  #e = /* @__PURE__ */ new Map();
  // Map of property alias to property type key (for quick lookup)
  #o = /* @__PURE__ */ new Map();
  // Map of property alias to property name (for dependency info)
  #s = /* @__PURE__ */ new Map();
  // Reverse dependency map: property key -> array of property keys that depend on it
  #t = /* @__PURE__ */ new Map();
  // Current document type key
  #r;
  constructor(e) {
    super(e, f), this.#l();
  }
  async #l() {
    console.log("in conditionals init"), this.consumeContext(b, (e) => {
      this.#i = e;
      const t = async () => {
        const o = e?.getContentTypeUnique();
        o && (console.log("Init - contentTypeId", o), this.#r = o, await this.#u(), await this.#c(), await this.#f(), await this.#y());
      };
      t(), this.observe(
        e?.contentTypeUnique,
        () => {
          t();
        },
        "observeDocumentUnique"
      );
    }), this.consumeContext(v, (e) => {
      this.#n = e;
    });
  }
  /**
   * Load all conditional configurations for the current document type
   */
  async #c() {
    debugger;
    if (!this.#r) {
      console.warn("[ConditionalFields] No document type key available");
      return;
    }
    try {
      const { data: e, error: t } = await w.getAllConfigurations();
      if (t) {
        console.warn("[ConditionalFields] Failed to load configurations:", t);
        return;
      }
      if (console.log("this.#configurations", { data: e, error: t }), !e)
        return;
      this.#e.clear(), this.#t.clear();
      for (const [o, i] of Object.entries(e))
        i && typeof i == "object" && this.#e.set(o, i);
      console.log("Built config, not doingbuilde reserve", this.#e), this.#d();
    } catch (e) {
      console.error("[ConditionalFields] Error loading configurations:", e);
    }
  }
  /**
   * Setup mappings between property aliases, keys, and names
   */
  async #u() {
    if (!this.#i) {
      console.warn("[ConditionalFields] Document context not available");
      return;
    }
    try {
      debugger;
      const e = await this.#i.structure?.getContentTypeProperties();
      if (!e) {
        console.warn("[ConditionalFields] No properties available");
        return;
      }
      this.#o.clear(), this.#s.clear();
      for (const t of e)
        t.alias && t.unique && (this.#o.set(t.alias, t.unique), this.#s.set(t.alias, t.name ?? t.alias));
    } catch (e) {
      console.error("[ConditionalFields] Error setting up property mappings:", e);
    }
  }
  /**
   * Build reverse dependency map to know which properties depend on each property
   */
  #d() {
    this.#t.clear();
    for (const [e, t] of this.#e) {
      if (!t.isConditional || !t.rules)
        continue;
      const o = l.getReferencedFields(t.rules);
      for (const i of o) {
        const n = this.#o.get(i);
        n && (this.#t.has(n) || this.#t.set(n, /* @__PURE__ */ new Set()), this.#t.get(n).add(e));
      }
    }
    console.log("Reverse Dependency Map:", this.#t);
  }
  /**
   * Setup observers for all properties referenced in conditional rules
   */
  async #f() {
    if (!this.#n) {
      console.warn("[ConditionalFields] Dataset context not available yet");
      return;
    }
    const e = /* @__PURE__ */ new Set();
    for (const [, t] of this.#e) {
      if (!t.isConditional || !t.rules)
        continue;
      const o = l.getReferencedFields(t.rules);
      for (const i of o)
        e.add(i);
    }
    for (const t of e)
      try {
        const o = await this.#n.propertyValueByAlias(t);
        o && this.observe(
          o,
          () => {
            this.#p(t);
          },
          `observe-property-${t}`
        );
      } catch (o) {
        console.warn(`[ConditionalFields] Could not observe property ${t}:`, o);
      }
  }
  /**
   * Called when a property value changes
   * Re-evaluates all properties that depend on the changed property
   */
  #p(e) {
    for (const [t, o] of this.#e) {
      if (!o.isConditional || !o.rules)
        continue;
      l.getReferencedFields(o.rules).has(e) && this.#a(t);
    }
  }
  /**
   * Perform initial evaluation for all conditional properties
   * Called after observers are setup
   */
  async #y() {
    await new Promise((e) => setTimeout(e, 5e3));
    for (const [e, t] of this.#e)
      console.log("Initial eval for", { propertyKey: e, config: t }), t.isConditional && this.#a(e);
  }
  /**
   * Evaluate rules for a property and apply visibility
   */
  async #a(e) {
    const t = this.#e.get(e);
    if (console.log("Evaluating visibility for", { propertyKey: e, config: t }), !t || !t.isConditional)
      return;
    let o;
    for (const [r, a] of this.#o)
      if (a === e) {
        o = r;
        break;
      }
    if (!o) {
      console.warn("[ConditionalFields] Could not find alias for property key:", e);
      return;
    }
    const i = /* @__PURE__ */ new Map(), n = l.getReferencedFields(t.rules);
    for (const r of n)
      try {
        const a = await this.#n?.propertyValueByAlias(r);
        if (a) {
          const p = await new Promise((y) => {
            const h = a.subscribe((g) => {
              h.unsubscribe(), y(g);
            });
          });
          i.set(r, p);
        }
      } catch (a) {
        console.warn(`[ConditionalFields] Could not get value for ${r}:`, a), i.set(r, void 0);
      }
    const s = l.evaluateRules(t.rules, i);
    this.#h(o, s);
  }
  /**
   * Apply visibility to a property element in the DOM
   */
  #h(e, t) {
    debugger;
    const o = document.querySelector("umb-content-workspace-view-edit");
    if (!o) {
      console.warn("[ConditionalFields] Could not find workspace element");
      return;
    }
    const i = [
      `umb-property[alias="${e}"]`,
      `umb-property[property-alias="${e}"]`,
      `[data-property-alias="${e}"]`,
      `[alias="${e}"]`
    ];
    let n = null;
    for (const s of i)
      if (n = o.querySelector(s), n)
        break;
    if (!n) {
      console.warn(`[ConditionalFields] Could not find property element for: ${e}`);
      return;
    }
    n.style.display = t ? "" : "none";
  }
  /**
   * Get dependency information for a property (for settings UI)
   * Returns list of properties that depend on the given property
   */
  getDependenciesFor(e) {
    const t = this.#t.get(e);
    if (!t || t.size === 0)
      return [];
    const o = [];
    for (const i of t) {
      let n;
      for (const [s, r] of this.#o)
        if (r === i) {
          n = s;
          break;
        }
      n && o.push({
        alias: n,
        name: this.#s.get(n) ?? n
      });
    }
    return o;
  }
}
const T = u, M = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT: f,
  UmbDocumentConditionalWorkspaceContext: u,
  api: T,
  default: u
}, Symbol.toStringTag, { value: "Module" }));
export {
  w as C,
  f as U,
  M as d
};
//# sourceMappingURL=document-conditional-workspace.context-Bg7y4rFl.js.map
