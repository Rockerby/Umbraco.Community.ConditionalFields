import { UmbContextBase as h } from "@umbraco-cms/backoffice/class-api";
import { UmbContextToken as y } from "@umbraco-cms/backoffice/context-api";
import { UMB_BLOCK_WORKSPACE_CONTEXT as C } from "@umbraco-cms/backoffice/block";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as m } from "@umbraco-cms/backoffice/document";
import { C as b, a as g } from "./sdk.gen-DVSN0z9Q.js";
const P = new y(
  "UmbBlockConditionalWorkspaceContext",
  "CndFlds.WorkspaceContext.Block.Conditional"
);
class k extends h {
  #o;
  #i;
  // Map of property type key to configuration
  #e = /* @__PURE__ */ new Map();
  // Map of property alias to property type key (for quick lookup)
  #t = /* @__PURE__ */ new Map();
  // Map of property alias to property name (for dependency info)
  #r = /* @__PURE__ */ new Map();
  // Reverse dependency map: property key -> array of property keys that depend on it
  #n = /* @__PURE__ */ new Map();
  // Current block content type key
  #a;
  constructor(o) {
    super(o, P), this.#d();
  }
  async #d() {
    console.log("[ConditionalProperties] ========================================"), console.log("[ConditionalProperties] Initializing BLOCK workspace context"), console.log("[ConditionalProperties] ========================================"), this.consumeContext(C, async (o) => {
      console.log("[ConditionalProperties] ✓ Block workspace context consumed", o), this.#o = o;
      try {
        this.consumeContext(m, async (e) => {
          console.log("[ConditionalProperties] ✓ Document workspace context consumed from block", e), this.#i = e;
        }).passContextAliasMatches();
      } catch (e) {
        console.warn("[ConditionalProperties] Could not access document context (this is OK if not in a document)", e);
      }
      await this.#u();
    });
  }
  async #u() {
    const o = this.#o?.content.getContentTypeId?.();
    if (console.log("[ConditionalProperties] Setting up block...", { contentTypeId: o }), !o) {
      console.warn("[ConditionalProperties] No content type ID available for block");
      return;
    }
    console.log("[ConditionalProperties] Block contentTypeId:", o), this.#a = o, await this.#g(), await this.#f(), await this.#y(), await this.#C(), console.log("[ConditionalProperties] Block setup complete"), this.observe(
      this.#o?.content.data,
      () => {
        console.log("[ConditionalProperties] Block content data changed"), this.#s();
      },
      "observeBlockContentData"
    ), this.observe(
      this.#o?.settings.data,
      () => {
        console.log("[ConditionalProperties] Block settings data changed"), this.#s();
      },
      "observeBlockSettingsData"
    ), this.#i && this.observe(
      this.#i.data,
      () => {
        console.log("[ConditionalProperties] Parent document data changed"), this.#s();
      },
      "observeDocumentData"
    );
  }
  /**
   * Called when any property value changes
   * Re-evaluates all conditional properties
   */
  #s() {
    console.log("[ConditionalProperties] Property value changed in block, re-evaluating all conditionals");
    for (const [o, e] of this.#e)
      e.isConditional && this.#l(o);
  }
  /**
   * Load all conditional configurations for the current block content type
   */
  async #f() {
    if (!this.#a) {
      console.warn("[ConditionalProperties] No content type key available");
      return;
    }
    try {
      const { data: o, error: e } = await b.getAllConfigurations();
      if (e) {
        console.warn("[ConditionalProperties] Failed to load configurations:", e);
        return;
      }
      if (console.log("Block configurations", { data: o, error: e }), !o)
        return;
      this.#e.clear(), this.#n.clear();
      for (const [n, i] of Object.entries(o))
        i && typeof i == "object" && this.#e.set(n, i);
      console.log("Built block config", this.#e), this.#h();
    } catch (o) {
      console.error("[ConditionalProperties] Error loading configurations:", o);
    }
  }
  /**
   * Setup mappings between property aliases, keys, and names
   */
  async #g() {
    if (!this.#o) {
      console.warn("[ConditionalProperties] Block context not available");
      return;
    }
    try {
      const e = await this.#o.content.structure?.getContentTypeProperties();
      if (!e) {
        console.warn("[ConditionalProperties] No properties available");
        return;
      }
      this.#t.clear(), this.#r.clear();
      for (const t of e)
        t.alias && t.unique && (this.#t.set(t.alias, t.unique), this.#r.set(t.alias, t.name ?? t.alias), console.log(`[ConditionalProperties] Mapped content property: ${t.alias} => ${t.unique}`));
      const i = await this.#o.settings.structure?.getContentTypeProperties();
      if (i) {
        console.log(`[ConditionalProperties] Found ${i.length} settings properties`);
        for (const t of i)
          t.alias && t.unique && (this.#t.set(t.alias, t.unique), this.#r.set(t.alias, t.name ?? t.alias), console.log(`[ConditionalProperties] Mapped settings property: ${t.alias} => ${t.unique}`));
      }
      console.log("[ConditionalProperties] Block property mappings complete. Total:", this.#t.size);
    } catch (o) {
      console.error("[ConditionalProperties] Error setting up property mappings:", o);
    }
  }
  /**
   * Build reverse dependency map to know which properties depend on each property
   */
  #h() {
    this.#n.clear();
    for (const [o, e] of this.#e) {
      if (!e.isConditional || !e.rules)
        continue;
      const n = g.getReferencedFields(e.rules);
      for (const i of n) {
        const t = this.#t.get(i);
        t && (this.#n.has(t) || this.#n.set(t, /* @__PURE__ */ new Set()), this.#n.get(t).add(o));
      }
    }
    console.log("Block Reverse Dependency Map:", this.#n);
  }
  /**
   * Setup observers for all properties referenced in conditional rules
   * Note: We're now using block data observer instead of individual property observers
   */
  async #y() {
    console.log("[ConditionalProperties] Block property observers setup (using block data observer)");
  }
  /**
   * Perform initial evaluation for all conditional properties
   * Called after observers are setup
   */
  async #C() {
    console.log("[ConditionalProperties] Performing initial evaluation of conditional properties in block"), await this.#m(), console.log(`[ConditionalProperties] UI rendered, evaluating ${this.#e.size} configurations`);
    for (const [o, e] of this.#e)
      console.log("Initial eval for block property", { propertyKey: o, config: e }), e.isConditional && this.#l(o);
    console.log("[ConditionalProperties] Initial evaluation complete");
  }
  /**
   * Wait for the UI to be rendered by watching for property elements in the DOM
   * Uses MutationObserver to detect when content is added
   */
  async #m() {
    return new Promise((o) => {
      console.log("[ConditionalProperties] Waiting for block UI to render...");
      const e = () => {
        const t = (d) => {
          const u = d.querySelector("umb-block-list-workspace, umb-block-grid-workspace, umb-block-rte-workspace");
          if (u) {
            const c = u.querySelector("umb-property");
            if (c) return c;
            if (u.shadowRoot) {
              const p = t(u.shadowRoot);
              if (p) return p;
            }
          }
          const r = d.querySelector("umb-property");
          if (r) return r;
          const s = d.querySelectorAll("*");
          for (const c of s)
            if (c.shadowRoot) {
              const p = t(c.shadowRoot);
              if (p) return p;
            }
          return null;
        };
        return t(document);
      };
      if (e()) {
        console.log("[ConditionalProperties] Block properties already rendered"), setTimeout(() => o(), 100);
        return;
      }
      let n;
      const i = new MutationObserver(() => {
        e() && (console.log("[ConditionalProperties] Block properties detected via MutationObserver"), i.disconnect(), clearTimeout(n), setTimeout(() => o(), 100));
      });
      i.observe(document.body, {
        childList: !0,
        subtree: !0
      }), n = window.setTimeout(() => {
        console.warn("[ConditionalProperties] Block UI render timeout - proceeding anyway"), i.disconnect(), o();
      }, 3e3);
    });
  }
  /**
   * Evaluate rules for a property and apply visibility
   */
  async #l(o) {
    const e = this.#e.get(o);
    if (console.log("Evaluating visibility for block property", { propertyKey: o, config: e }), !e || !e.isConditional)
      return;
    let n;
    for (const [a, l] of this.#t)
      if (l === o) {
        n = a;
        break;
      }
    if (!n) {
      console.warn("[ConditionalProperties] Could not find alias for property key:", o);
      return;
    }
    const i = /* @__PURE__ */ new Map(), t = g.getReferencedFields(e.rules), u = this.#o?.content.getData()?.values || [], s = this.#o?.settings.getData()?.values || [], c = this.#i?.getData();
    for (const a of t)
      try {
        let l = u.find((f) => f.alias === a)?.value;
        l === void 0 && (l = s.find((f) => f.alias === a)?.value), l === void 0 && c ? (l = c?.values?.find((f) => f.alias === a)?.value, console.log(`[ConditionalProperties] Got value for ${a} from parent document:`, l)) : console.log(`[ConditionalProperties] Got value for ${a} from block:`, l), i.set(a, l);
      } catch (l) {
        console.warn(`[ConditionalProperties] Could not get value for ${a}:`, l), i.set(a, void 0);
      }
    const p = g.evaluateRules(e.rules, i);
    this.#c(n, p);
  }
  /**
   * Apply visibility to a property element in the DOM (within block modal)
   * Includes retry logic if element not found immediately
   */
  #c(o, e, n = 0) {
    console.log(`[ConditionalProperties] Applying visibility in block to ${o}: ${e} (attempt ${n + 1})`);
    const i = this.#b(o);
    if (!i) {
      if (n < 5) {
        const t = 200 * (n + 1);
        console.warn(`[ConditionalProperties] Property element not found in block for: ${o}, retrying in ${t}ms...`), setTimeout(() => {
          this.#c(o, e, n + 1);
        }, t);
      } else
        console.error(`[ConditionalProperties] Could not find property element in block for: ${o} after ${n} retries`), console.error(`[ConditionalProperties] Tried searching in document for property with alias: ${o}`);
      return;
    }
    i.style.display = e ? "" : "none", console.log(`[ConditionalProperties] ✓ Successfully applied visibility in block to ${o}`);
  }
  /**
   * Find a property element within the block modal
   * Searches recursively through the shadow DOM starting from the umb-app element
   */
  #b(o) {
    console.log(`[ConditionalProperties] Searching for property: ${o}`);
    const e = document.querySelector("umb-app"), n = e?.shadowRoot || document;
    return console.log(`[ConditionalProperties] Starting search from: ${e?.shadowRoot ? "umb-app shadowRoot" : "document"}`), this.#p(n, o);
  }
  /**
   * Search for a property element by alias
   * depth parameter is for debugging only
   */
  #p(o, e, n = 0) {
    if (n > 25)
      return console.warn("[ConditionalProperties] Max search depth reached"), null;
    const i = [
      `umb-property[alias="${e}"]`,
      `umb-property[property-alias="${e}"]`,
      `[data-property-alias="${e}"]`,
      `[alias="${e}"]`
    ];
    for (const r of i) {
      const s = o.querySelector(r);
      if (s)
        return console.log(`[ConditionalProperties] ✓ Found property element using selector: ${r} at depth ${n}`), s;
    }
    const t = o.querySelectorAll("umb-property");
    t.length > 0 && console.log(`[ConditionalProperties] Found ${t.length} umb-property elements at depth ${n}`);
    for (const r of t) {
      const s = r.getAttribute("alias") || r.getAttribute("property-alias") || r.getAttribute("data-property-alias");
      if (s === e)
        return console.log(`[ConditionalProperties] ✓ Found property by attribute match: ${s} at depth ${n}`), r;
    }
    const d = o.querySelectorAll("umb-property-type-based-property");
    d.length > 0 && console.log(`[ConditionalProperties] Found ${d.length} umb-property-type-based-property elements at depth ${n}`);
    for (const r of d) {
      const s = r.getAttribute("data-path");
      if (s) {
        const c = s.match(/@\.alias == '([^']+)'/);
        if (c && c[1] === e) {
          console.log(`[ConditionalProperties] ✓ Found property by data-path match: ${c[1]} at depth ${n}`);
          const p = r.getRootNode();
          if (p instanceof ShadowRoot && p.host) {
            const l = p.host;
            return console.log(`[ConditionalProperties] ✓ Property is in shadow root, returning host element: ${l.tagName}`), l;
          }
          const a = r.parentElement;
          return a ? (console.log(`[ConditionalProperties] ✓ Returning parent wrapper element: ${a.tagName}`), a) : r;
        }
      }
    }
    const u = o.querySelectorAll("*");
    for (const r of u)
      if (r.shadowRoot) {
        const s = this.#p(r.shadowRoot, e, n + 1);
        if (s)
          return s;
      }
    return null;
  }
  /**
   * Get dependency information for a property (for settings UI)
   * Returns list of properties that depend on the given property
   */
  getDependenciesFor(o) {
    const e = this.#n.get(o);
    if (!e || e.size === 0)
      return [];
    const n = [];
    for (const i of e) {
      let t;
      for (const [d, u] of this.#t)
        if (u === i) {
          t = d;
          break;
        }
      t && n.push({
        alias: t,
        name: this.#r.get(t) ?? t
      });
    }
    return n;
  }
}
const M = k;
export {
  P as UMB_BLOCK_CONDITIONAL_WORKSPACE_CONTEXT,
  k as UmbBlockConditionalWorkspaceContext,
  M as api,
  k as default
};
//# sourceMappingURL=block-conditional-workspace.context-DkPrMM5u.js.map
