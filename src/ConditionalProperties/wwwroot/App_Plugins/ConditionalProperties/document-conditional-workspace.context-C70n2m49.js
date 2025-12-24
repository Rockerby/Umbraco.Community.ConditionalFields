import { UmbContextBase as u } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as f } from "@umbraco-cms/backoffice/context-api";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as y } from "@umbraco-cms/backoffice/document";
import { C as g, a as d } from "./sdk.gen-DVSN0z9Q.js";
const h = new f(
  "UmbDocumentConditionalWorkspaceContext",
  "CndFlds.WorkspaceContext.Document.Conditional"
);
class m extends u {
  #t;
  // Map of property type key to configuration
  #e = /* @__PURE__ */ new Map();
  // Map of property alias to property type key (for quick lookup)
  #n = /* @__PURE__ */ new Map();
  // Map of property alias to property name (for dependency info)
  #i = /* @__PURE__ */ new Map();
  // Reverse dependency map: property key -> array of property keys that depend on it
  #o = /* @__PURE__ */ new Map();
  // Current document type key
  #r;
  constructor(e) {
    super(e, h), this.#c();
  }
  async #l() {
    const e = this.#t?.getContentTypeUnique();
    e && (console.log("[ConditionalProperties] Init - contentTypeId", e), this.#r = e, await this.#u(), await this.#p(), await this.#y(), await this.#g());
  }
  async #c() {
    console.log("[ConditionalProperties] Initializing workspace context"), this.consumeContext(y, async (e) => {
      console.log("[ConditionalProperties] Document workspace context consumed"), this.#t = e;
      const o = async () => {
        await this.#l();
      };
      await o(), this.observe(
        e?.data,
        () => {
          console.log("[ConditionalProperties] Data changed"), this.#d();
        },
        "observeData"
      ), this.observe(
        e?.contentTypeUnique,
        () => {
          console.log("[ConditionalProperties] Document type changed, re-initializing"), o();
        },
        "observeDocumentUnique"
      );
    });
  }
  /**
   * Called when any property value changes
   * Re-evaluates all conditional properties
   */
  #d() {
    console.log("[ConditionalProperties] Property value changed, re-evaluating all conditionals");
    for (const [e, o] of this.#e)
      o.isConditional && this.#s(e);
  }
  /**
   * Load all conditional configurations for the current document type
   */
  async #p() {
    if (!this.#r) {
      console.warn("[ConditionalProperties] No document type key available");
      return;
    }
    try {
      const { data: e, error: o } = await g.getAllConfigurations();
      if (o) {
        console.warn("[ConditionalProperties] Failed to load configurations:", o);
        return;
      }
      if (console.log("this.#configurations", { data: e, error: o }), !e)
        return;
      this.#e.clear(), this.#o.clear();
      for (const [t, n] of Object.entries(e))
        n && typeof n == "object" && this.#e.set(t, n);
      console.log("Built config, not doingbuilde reserve", this.#e), this.#f();
    } catch (e) {
      console.error("[ConditionalProperties] Error loading configurations:", e);
    }
  }
  /**
   * Setup mappings between property aliases, keys, and names
   */
  async #u() {
    if (!this.#t) {
      console.warn("[ConditionalProperties] Document context not available");
      return;
    }
    try {
      const e = await this.#t.structure?.getContentTypeProperties();
      if (!e) {
        console.warn("[ConditionalProperties] No properties available");
        return;
      }
      this.#n.clear(), this.#i.clear();
      for (const o of e)
        o.alias && o.unique && (this.#n.set(o.alias, o.unique), this.#i.set(o.alias, o.name ?? o.alias));
    } catch (e) {
      console.error("[ConditionalProperties] Error setting up property mappings:", e);
    }
  }
  /**
   * Build reverse dependency map to know which properties depend on each property
   */
  #f() {
    this.#o.clear();
    for (const [e, o] of this.#e) {
      if (!o.isConditional || !o.rules)
        continue;
      const t = d.getReferencedFields(o.rules);
      for (const n of t) {
        const i = this.#n.get(n);
        i && (this.#o.has(i) || this.#o.set(i, /* @__PURE__ */ new Set()), this.#o.get(i).add(e));
      }
    }
    console.log("Reverse Dependency Map:", this.#o);
  }
  /**
   * Setup observers for all properties referenced in conditional rules
   * Note: We're now using variant data observer instead of individual property observers
   */
  async #y() {
    console.log("[ConditionalProperties] Property observers setup (using variant data observer)");
  }
  /**
   * Perform initial evaluation for all conditional properties
   * Called after observers are setup
   */
  async #g() {
    console.log("[ConditionalProperties] Performing initial evaluation of conditional properties"), await this.#h();
    for (const [e, o] of this.#e)
      console.log("Initial eval for", { propertyKey: e, config: o }), o.isConditional && this.#s(e);
  }
  /**
   * Wait for the UI to be rendered by watching for property elements in the DOM
   * Uses MutationObserver to detect when content is added
   */
  async #h() {
    return new Promise((e) => {
      console.log("[ConditionalProperties] Waiting for UI to render...");
      const o = () => {
        const i = (c) => {
          const a = c.querySelector("umb-property");
          if (a) return a;
          const r = c.querySelectorAll("*");
          for (const l of r)
            if (l.shadowRoot) {
              const p = i(l.shadowRoot);
              if (p) return p;
            }
          return null;
        }, s = document.querySelector("umb-app");
        return s ? null : i(s);
      };
      if (o()) {
        console.log("[ConditionalProperties] Properties already rendered"), setTimeout(() => e(), 100);
        return;
      }
      let t;
      const n = new MutationObserver(() => {
        o() && (console.log("[ConditionalProperties] Properties detected via MutationObserver"), n.disconnect(), clearTimeout(t), setTimeout(() => e(), 100));
      });
      n.observe(document.body, {
        childList: !0,
        subtree: !0
      }), t = window.setTimeout(() => {
        console.warn("[ConditionalProperties] UI render timeout - proceeding anyway"), n.disconnect(), e();
      }, 200);
    });
  }
  /**
   * Evaluate rules for a property and apply visibility
   */
  async #s(e) {
    const o = this.#e.get(e);
    if (console.log("Evaluating visibility for", { propertyKey: e, config: o }), !o || !o.isConditional)
      return;
    let t;
    for (const [a, r] of this.#n)
      if (r === e) {
        t = a;
        break;
      }
    if (!t) {
      console.warn("[ConditionalProperties] Could not find alias for property key:", e);
      return;
    }
    const n = /* @__PURE__ */ new Map(), i = d.getReferencedFields(o.rules), s = this.#t?.getData();
    for (const a of i)
      try {
        const r = s?.values?.find((l) => l.alias === a)?.value;
        n.set(a, r), console.log(`[ConditionalProperties] Got value for ${a}:`, r);
      } catch (r) {
        console.warn(`[ConditionalProperties] Could not get value for ${a}:`, r), n.set(a, void 0);
      }
    const c = d.evaluateRules(o.rules, n);
    this.#a(t, c);
  }
  /**
   * Apply visibility to a property element in the DOM
   * Includes retry logic if element not found immediately
   */
  #a(e, o, t = 0) {
    console.log(`[ConditionalProperties] Applying visibility to ${e}: ${o} (attempt ${t + 1})`);
    const n = (s) => {
      const c = [
        `umb-property[alias="${e}"]`,
        `umb-property[property-alias="${e}"]`,
        `[data-property-alias="${e}"]`,
        `[alias="${e}"]`
      ];
      for (const r of c) {
        const l = s.querySelector(r);
        if (l)
          return console.log(`[ConditionalProperties] Found property element using selector: ${r}`), l;
      }
      const a = s.querySelectorAll("*");
      for (const r of a)
        if (r.shadowRoot) {
          const l = n(r.shadowRoot);
          if (l)
            return l;
        }
      return null;
    }, i = n(document);
    if (!i) {
      if (t < 5) {
        const s = 200 * (t + 1);
        console.warn(`[ConditionalProperties] Property element not found for: ${e}, retrying in ${s}ms...`), setTimeout(() => {
          this.#a(e, o, t + 1);
        }, s);
      } else
        console.error(`[ConditionalProperties] Could not find property element for: ${e} after ${t} retries`);
      return;
    }
    i.style.display = o ? "" : "none", console.log(`[ConditionalProperties] Successfully applied visibility to ${e}`);
  }
  /**
   * Get dependency information for a property (for settings UI)
   * Returns list of properties that depend on the given property
   */
  getDependenciesFor(e) {
    const o = this.#o.get(e);
    if (!o || o.size === 0)
      return [];
    const t = [];
    for (const n of o) {
      let i;
      for (const [s, c] of this.#n)
        if (c === n) {
          i = s;
          break;
        }
      i && t.push({
        alias: i,
        name: this.#i.get(i) ?? i
      });
    }
    return t;
  }
}
const T = m;
export {
  h as UMB_DOCUMENT_CONDITIONAL_WORKSPACE_CONTEXT,
  m as UmbDocumentConditionalWorkspaceContext,
  T as api,
  m as default
};
//# sourceMappingURL=document-conditional-workspace.context-C70n2m49.js.map
