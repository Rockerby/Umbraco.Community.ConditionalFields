import { UmbContextBase as m } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as h } from "@umbraco-cms/backoffice/context-api";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as C } from "@umbraco-cms/backoffice/document";
import { c as u } from "./client.gen-D-YAh4px.js";
class d {
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
        const r = Number(n), s = Number(i);
        return !isNaN(r) && !isNaN(s) && r > s;
      }
      case "LessThan": {
        const r = Number(n), s = Number(i);
        return !isNaN(r) && !isNaN(s) && r < s;
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
      const n = e[i], r = this.evaluateRule(n, t.get(n.fieldAlias));
      n.logicalOperator === "Or" ? o = o || r : o = o && r;
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
class b {
  static deleteConfiguration(e) {
    return (e.client ?? u).delete({
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
    return (e.client ?? u).get({
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
    return (e.client ?? u).post({
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
    return (e?.client ?? u).get({
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
const y = new h(
  "UmbDocumentConditionalWorkspaceContext",
  "CndFlds.WorkspaceContext.Document.Conditional"
);
class p extends m {
  #n;
  // Map of property type key to configuration
  #e = /* @__PURE__ */ new Map();
  // Map of property alias to property type key (for quick lookup)
  #o = /* @__PURE__ */ new Map();
  // Map of property alias to property name (for dependency info)
  #i = /* @__PURE__ */ new Map();
  // Reverse dependency map: property key -> array of property keys that depend on it
  #t = /* @__PURE__ */ new Map();
  // Current document type key
  #r;
  constructor(e) {
    super(e, y), this.#l();
  }
  async #l() {
    console.log("[ConditionalProperties] Initializing workspace context"), this.consumeContext(C, async (e) => {
      console.log("[ConditionalProperties] Document workspace context consumed"), this.#n = e;
      const t = async () => {
        const o = e?.getContentTypeUnique();
        o && (console.log("[ConditionalProperties] Init - contentTypeId", o), this.#r = o, await this.#d(), await this.#u(), await this.#f(), await this.#g());
      };
      await t(), this.observe(
        e?.data,
        () => {
          console.log("[ConditionalProperties] Data changed"), this.#c();
        },
        "observeData"
      ), this.observe(
        e?.contentTypeUnique,
        () => {
          console.log("[ConditionalProperties] Document type changed, re-initializing"), t();
        },
        "observeDocumentUnique"
      );
    });
  }
  /**
   * Called when any property value changes
   * Re-evaluates all conditional properties
   */
  #c() {
    console.log("[ConditionalProperties] Property value changed, re-evaluating all conditionals");
    for (const [e, t] of this.#e)
      t.isConditional && this.#s(e);
  }
  /**
   * Load all conditional configurations for the current document type
   */
  async #u() {
    if (!this.#r) {
      console.warn("[ConditionalProperties] No document type key available");
      return;
    }
    try {
      const { data: e, error: t } = await b.getAllConfigurations();
      if (t) {
        console.warn("[ConditionalProperties] Failed to load configurations:", t);
        return;
      }
      if (console.log("this.#configurations", { data: e, error: t }), !e)
        return;
      this.#e.clear(), this.#t.clear();
      for (const [o, i] of Object.entries(e))
        i && typeof i == "object" && this.#e.set(o, i);
      console.log("Built config, not doingbuilde reserve", this.#e), this.#p();
    } catch (e) {
      console.error("[ConditionalProperties] Error loading configurations:", e);
    }
  }
  /**
   * Setup mappings between property aliases, keys, and names
   */
  async #d() {
    if (!this.#n) {
      console.warn("[ConditionalProperties] Document context not available");
      return;
    }
    try {
      const e = await this.#n.structure?.getContentTypeProperties();
      if (!e) {
        console.warn("[ConditionalProperties] No properties available");
        return;
      }
      this.#o.clear(), this.#i.clear();
      for (const t of e)
        t.alias && t.unique && (this.#o.set(t.alias, t.unique), this.#i.set(t.alias, t.name ?? t.alias));
    } catch (e) {
      console.error("[ConditionalProperties] Error setting up property mappings:", e);
    }
  }
  /**
   * Build reverse dependency map to know which properties depend on each property
   */
  #p() {
    this.#t.clear();
    for (const [e, t] of this.#e) {
      if (!t.isConditional || !t.rules)
        continue;
      const o = d.getReferencedFields(t.rules);
      for (const i of o) {
        const n = this.#o.get(i);
        n && (this.#t.has(n) || this.#t.set(n, /* @__PURE__ */ new Set()), this.#t.get(n).add(e));
      }
    }
    console.log("Reverse Dependency Map:", this.#t);
  }
  /**
   * Setup observers for all properties referenced in conditional rules
   * Note: We're now using variant data observer instead of individual property observers
   */
  async #f() {
    console.log("[ConditionalProperties] Property observers setup (using variant data observer)");
  }
  /**
   * Perform initial evaluation for all conditional properties
   * Called after observers are setup
   */
  async #g() {
    console.log("[ConditionalProperties] Performing initial evaluation of conditional properties"), await this.#y();
    for (const [e, t] of this.#e)
      console.log("Initial eval for", { propertyKey: e, config: t }), t.isConditional && this.#s(e);
  }
  /**
   * Wait for the UI to be rendered by watching for property elements in the DOM
   * Uses MutationObserver to detect when content is added
   */
  async #y() {
    return new Promise((e) => {
      console.log("[ConditionalProperties] Waiting for UI to render...");
      const t = () => {
        const n = (s) => {
          const l = s.querySelector("umb-property");
          if (l) return l;
          const a = s.querySelectorAll("*");
          for (const c of a)
            if (c.shadowRoot) {
              const g = n(c.shadowRoot);
              if (g) return g;
            }
          return null;
        }, r = document.querySelector("umb-app");
        return r ? null : n(r);
      };
      if (t()) {
        console.log("[ConditionalProperties] Properties already rendered"), setTimeout(() => e(), 100);
        return;
      }
      let o;
      const i = new MutationObserver(() => {
        t() && (console.log("[ConditionalProperties] Properties detected via MutationObserver"), i.disconnect(), clearTimeout(o), setTimeout(() => e(), 100));
      });
      i.observe(document.body, {
        childList: !0,
        subtree: !0
      }), o = window.setTimeout(() => {
        console.warn("[ConditionalProperties] UI render timeout - proceeding anyway"), i.disconnect(), e();
      }, 200);
    });
  }
  /**
   * Evaluate rules for a property and apply visibility
   */
  async #s(e) {
    const t = this.#e.get(e);
    if (console.log("Evaluating visibility for", { propertyKey: e, config: t }), !t || !t.isConditional)
      return;
    let o;
    for (const [l, a] of this.#o)
      if (a === e) {
        o = l;
        break;
      }
    if (!o) {
      console.warn("[ConditionalProperties] Could not find alias for property key:", e);
      return;
    }
    const i = /* @__PURE__ */ new Map(), n = d.getReferencedFields(t.rules), r = this.#n?.getData();
    for (const l of n)
      try {
        const a = r?.values?.find((c) => c.alias === l)?.value;
        i.set(l, a), console.log(`[ConditionalProperties] Got value for ${l}:`, a);
      } catch (a) {
        console.warn(`[ConditionalProperties] Could not get value for ${l}:`, a), i.set(l, void 0);
      }
    const s = d.evaluateRules(t.rules, i);
    this.#a(o, s);
  }
  /**
   * Apply visibility to a property element in the DOM
   * Includes retry logic if element not found immediately
   */
  #a(e, t, o = 0) {
    console.log(`[ConditionalProperties] Applying visibility to ${e}: ${t} (attempt ${o + 1})`);
    const i = (r) => {
      const s = [
        `umb-property[alias="${e}"]`,
        `umb-property[property-alias="${e}"]`,
        `[data-property-alias="${e}"]`,
        `[alias="${e}"]`
      ];
      for (const a of s) {
        const c = r.querySelector(a);
        if (c)
          return console.log(`[ConditionalProperties] Found property element using selector: ${a}`), c;
      }
      const l = r.querySelectorAll("*");
      for (const a of l)
        if (a.shadowRoot) {
          const c = i(a.shadowRoot);
          if (c)
            return c;
        }
      return null;
    }, n = i(document);
    if (!n) {
      if (o < 5) {
        const r = 200 * (o + 1);
        console.warn(`[ConditionalProperties] Property element not found for: ${e}, retrying in ${r}ms...`), setTimeout(() => {
          this.#a(e, t, o + 1);
        }, r);
      } else
        console.error(`[ConditionalProperties] Could not find property element for: ${e} after ${o} retries`);
      return;
    }
    n.style.display = t ? "" : "none", console.log(`[ConditionalProperties] Successfully applied visibility to ${e}`);
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
      for (const [r, s] of this.#o)
        if (s === i) {
          n = r;
          break;
        }
      n && o.push({
        alias: n,
        name: this.#i.get(n) ?? n
      });
    }
    return o;
  }
}
const v = p, R = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT: y,
  UmbDocumentConditionalWorkspaceContext: p,
  api: v,
  default: p
}, Symbol.toStringTag, { value: "Module" }));
export {
  b as C,
  y as U,
  R as d
};
//# sourceMappingURL=document-conditional-workspace.context-BvrHaWXi.js.map
