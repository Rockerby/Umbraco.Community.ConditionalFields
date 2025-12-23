import { UmbContextBase as h } from "@umbraco-cms/backoffice/class-api";
import { UmbContextConsumerController as u, UmbContextToken as y } from "@umbraco-cms/backoffice/context-api";
import { C as g, a as d } from "./sdk.gen-DVSN0z9Q.js";
import { UMB_BLOCK_WORKSPACE_CONTEXT as m } from "@umbraco-cms/backoffice/block";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as C } from "@umbraco-cms/backoffice/document";
import { UMB_MEDIA_WORKSPACE_CONTEXT as P } from "@umbraco-cms/backoffice/media";
class k {
  #e;
  #o;
  #t;
  constructor(e) {
    this.#o = new u(e, m, (t) => {
      t && (console.log("[BlockWorkspaceAdapter] Block workspace context consumed"), this.#e = t, this.#t && (this.#t(!0), this.#t = void 0));
    });
  }
  async initialize() {
    return this.#e ? !0 : new Promise((e) => {
      this.#t = e, setTimeout(() => {
        this.#e || (console.warn("[BlockWorkspaceAdapter] Block workspace context not available"), e(!1));
      }, 1e3);
    });
  }
  getContext() {
    return this.#e;
  }
  getContentTypeKey() {
    return this.#e?.content?.getContentTypeId();
  }
  getPropertyValue(e) {
    if (!this.#e)
      return;
    let t = this.#e.content?.getPropertyValue(e);
    return t === void 0 && this.#e.settings && (t = this.#e.settings.getPropertyValue(e)), t;
  }
  setupPropertyObservers(e) {
    console.log("[BlockWorkspaceAdapter] setupPropertyObservers called (handled by context)");
  }
  async getPropertyStructures() {
    if (!this.#e)
      return console.warn("[BlockWorkspaceAdapter] Context not available"), [];
    try {
      const e = [];
      if (this.#e.content?.structure) {
        const t = await this.#e.content.structure.getContentTypeProperties();
        t && e.push(...t);
      }
      if (this.#e.settings?.structure) {
        const t = await this.#e.settings.structure.getContentTypeProperties();
        t && e.push(...t);
      }
      return e;
    } catch (e) {
      return console.error("[BlockWorkspaceAdapter] Error getting property structures:", e), [];
    }
  }
  getContentTypeName() {
    return "Block";
  }
  destroy() {
    this.#o;
  }
}
class w {
  #e;
  #o;
  #t;
  constructor(e) {
    this.#o = new u(e, C, (t) => {
      t && (console.log("[DocumentWorkspaceAdapter] Document workspace context consumed"), this.#e = t, this.#t && (this.#t(!0), this.#t = void 0));
    });
  }
  async initialize() {
    return this.#e ? !0 : new Promise((e) => {
      this.#t = e, setTimeout(() => {
        this.#e || (console.warn("[DocumentWorkspaceAdapter] Document workspace context not available"), e(!1));
      }, 1e3);
    });
  }
  getContext() {
    return this.#e;
  }
  getContentTypeKey() {
    return this.#e?.getContentTypeUnique();
  }
  getPropertyValue(e) {
    return this.#e?.getData()?.values?.find((r) => r.alias === e)?.value;
  }
  setupPropertyObservers(e) {
    console.log("[DocumentWorkspaceAdapter] setupPropertyObservers called (handled by context)");
  }
  async getPropertyStructures() {
    if (!this.#e)
      return console.warn("[DocumentWorkspaceAdapter] Context not available"), [];
    try {
      return await this.#e.structure?.getContentTypeProperties() ?? [];
    } catch (e) {
      return console.error("[DocumentWorkspaceAdapter] Error getting property structures:", e), [];
    }
  }
  getContentTypeName() {
    return "Document";
  }
  destroy() {
    this.#o;
  }
}
class b {
  #e;
  #o;
  #t;
  constructor(e) {
    this.#o = new u(e, P, (t) => {
      t && (console.log("[MediaWorkspaceAdapter] Media workspace context consumed"), this.#e = t, this.#t && (this.#t(!0), this.#t = void 0));
    });
  }
  async initialize() {
    return this.#e ? !0 : new Promise((e) => {
      this.#t = e, setTimeout(() => {
        this.#e || (console.warn("[MediaWorkspaceAdapter] Media workspace context not available"), e(!1));
      }, 1e3);
    });
  }
  getContext() {
    return this.#e;
  }
  getContentTypeKey() {
    return this.#e?.getContentTypeUnique();
  }
  getPropertyValue(e) {
    return this.#e?.getData()?.values?.find((r) => r.alias === e)?.value;
  }
  setupPropertyObservers(e) {
    console.log("[MediaWorkspaceAdapter] setupPropertyObservers called (handled by context)");
  }
  async getPropertyStructures() {
    if (!this.#e)
      return console.warn("[MediaWorkspaceAdapter] Context not available"), [];
    try {
      return await this.#e.structure?.getContentTypeProperties() ?? [];
    } catch (e) {
      return console.error("[MediaWorkspaceAdapter] Error getting property structures:", e), [];
    }
  }
  getContentTypeName() {
    return "Media";
  }
  destroy() {
    this.#o;
  }
}
async function v(l) {
  console.log("[WorkspaceAdapterFactory] Detecting workspace type...");
  const e = new k(l);
  if (await e.initialize())
    return console.log("[WorkspaceAdapterFactory] Using Block workspace adapter"), e;
  e.destroy();
  const t = new w(l);
  if (await t.initialize())
    return console.log("[WorkspaceAdapterFactory] Using Document workspace adapter"), t;
  t.destroy();
  const o = new b(l);
  return await o.initialize() ? (console.log("[WorkspaceAdapterFactory] Using Media workspace adapter"), o) : (o.destroy(), console.warn("[WorkspaceAdapterFactory] No compatible workspace context found"), null);
}
const T = new y(
  "UmbGenericConditionalWorkspaceContext",
  "CndFlds.WorkspaceContext.Generic.Conditional"
);
class E extends h {
  #e;
  // Map of property type key to configuration
  #o = /* @__PURE__ */ new Map();
  // Map of property alias to property type key (for quick lookup)
  #t = /* @__PURE__ */ new Map();
  // Map of property alias to property name (for dependency info)
  #i = /* @__PURE__ */ new Map();
  // Reverse dependency map: property key -> array of property keys that depend on it
  #r = /* @__PURE__ */ new Map();
  // Current content type key
  #s;
  constructor(e) {
    super(e, T), this.#l();
  }
  async #l() {
    console.log("[ConditionalProperties] Initializing generic workspace context");
    const e = await v(this._host);
    if (!e) {
      console.warn("[ConditionalProperties] No compatible workspace adapter found");
      return;
    }
    this.#e = e, console.log(`[ConditionalProperties] Using ${this.#e.getContentTypeName()} workspace adapter`);
    const t = this.#e.getContentTypeKey();
    t && (console.log("[ConditionalProperties] Init - contentTypeKey", t), this.#s = t, await this.#u(), await this.#d(), this.#p(), await this.#h());
  }
  /**
   * Setup property change observers based on the adapter type
   */
  #p() {
    if (!this.#e)
      return;
    const e = this.#e.getContentTypeName();
    if (e === "Block") {
      const o = this.#e.getContext();
      o && (o.content && this.observe(
        o.content.data,
        () => {
          console.log("[ConditionalProperties] Block content data changed"), this.#n();
        },
        "blockContentDataObserver"
      ), o.settings && this.observe(
        o.settings.data,
        () => {
          console.log("[ConditionalProperties] Block settings data changed"), this.#n();
        },
        "blockSettingsDataObserver"
      ));
    } else if (e === "Document") {
      const o = this.#e.getContext();
      o && (this.observe(
        o.data,
        () => {
          console.log("[ConditionalProperties] Document data changed"), this.#n();
        },
        "documentDataObserver"
      ), this.observe(
        o.contentTypeUnique,
        () => {
          console.log("[ConditionalProperties] Document content type changed"), this.#n();
        },
        "documentContentTypeObserver"
      ));
    } else if (e === "Media") {
      const o = this.#e.getContext();
      o && (this.observe(
        o.data,
        () => {
          console.log("[ConditionalProperties] Media data changed"), this.#n();
        },
        "mediaDataObserver"
      ), this.observe(
        o.contentTypeUnique,
        () => {
          console.log("[ConditionalProperties] Media content type changed"), this.#n();
        },
        "mediaContentTypeObserver"
      ));
    }
  }
  /**
   * Called when any property value changes
   * Re-evaluates all conditional properties
   */
  #n() {
    console.log("[ConditionalProperties] Property value changed, re-evaluating all conditionals");
    for (const [e, t] of this.#o)
      t.isConditional && this.#a(e);
  }
  /**
   * Load all conditional configurations for the current content type
   */
  async #d() {
    if (!this.#s) {
      console.warn("[ConditionalProperties] No content type key available");
      return;
    }
    try {
      const { data: e, error: t } = await g.getAllConfigurations();
      if (t) {
        console.warn("[ConditionalProperties] Failed to load configurations:", t);
        return;
      }
      if (console.log("this.#configurations", { data: e, error: t }), !e)
        return;
      this.#o.clear(), this.#r.clear();
      for (const [o, r] of Object.entries(e))
        r && typeof r == "object" && this.#o.set(o, r);
      console.log("Built config, not doing build reserve", this.#o), this.#f();
    } catch (e) {
      console.error("[ConditionalProperties] Error loading configurations:", e);
    }
  }
  /**
   * Setup mappings between property aliases, keys, and names
   */
  async #u() {
    if (!this.#e) {
      console.warn("[ConditionalProperties] Adapter not available");
      return;
    }
    try {
      const e = await this.#e.getPropertyStructures();
      if (!e || e.length === 0) {
        console.warn("[ConditionalProperties] No properties available");
        return;
      }
      this.#t.clear(), this.#i.clear();
      for (const t of e)
        t.alias && t.unique && (this.#t.set(t.alias, t.unique), this.#i.set(t.alias, t.name ?? t.alias));
    } catch (e) {
      console.error("[ConditionalProperties] Error setting up property mappings:", e);
    }
  }
  /**
   * Build reverse dependency map to know which properties depend on each property
   */
  #f() {
    this.#r.clear();
    for (const [e, t] of this.#o) {
      if (!t.isConditional || !t.rules)
        continue;
      const o = d.getReferencedFields(t.rules);
      for (const r of o) {
        const n = this.#t.get(r);
        n && (this.#r.has(n) || this.#r.set(n, /* @__PURE__ */ new Set()), this.#r.get(n).add(e));
      }
    }
    console.log("Reverse Dependency Map:", this.#r);
  }
  /**
   * Perform initial evaluation for all conditional properties
   * Called after observers are setup
   */
  async #h() {
    console.log("[ConditionalProperties] Performing initial evaluation of conditional properties"), await this.#y();
    for (const [e, t] of this.#o)
      console.log("Initial eval for", { propertyKey: e, config: t }), t.isConditional && this.#a(e);
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
          const a = s.querySelector("umb-property");
          if (a) return a;
          const p = s.querySelectorAll("*");
          for (const c of p)
            if (c.shadowRoot) {
              const f = n(c.shadowRoot);
              if (f) return f;
            }
          return null;
        }, i = document.querySelector("umb-app");
        return i ? n(i) : null;
      };
      if (t()) {
        console.log("[ConditionalProperties] Properties already rendered"), setTimeout(() => e(), 100);
        return;
      }
      let o;
      const r = new MutationObserver(() => {
        t() && (console.log("[ConditionalProperties] Properties detected via MutationObserver"), r.disconnect(), clearTimeout(o), setTimeout(() => e(), 100));
      });
      r.observe(document.body, {
        childList: !0,
        subtree: !0
      }), o = window.setTimeout(() => {
        console.warn("[ConditionalProperties] UI render timeout - proceeding anyway"), r.disconnect(), e();
      }, 500);
    });
  }
  /**
   * Evaluate rules for a property and apply visibility
   */
  async #a(e) {
    const t = this.#o.get(e);
    if (console.log("Evaluating visibility for", { propertyKey: e, config: t }), !t || !t.isConditional)
      return;
    let o;
    for (const [s, a] of this.#t)
      if (a === e) {
        o = s;
        break;
      }
    if (!o) {
      console.warn("[ConditionalProperties] Could not find alias for property key:", e);
      return;
    }
    const r = /* @__PURE__ */ new Map(), n = d.getReferencedFields(t.rules);
    for (const s of n)
      try {
        const a = this.#e?.getPropertyValue(s);
        r.set(s, a), console.log(`[ConditionalProperties] Got value for ${s}:`, a);
      } catch (a) {
        console.warn(`[ConditionalProperties] Could not get value for ${s}:`, a), r.set(s, void 0);
      }
    const i = d.evaluateRules(t.rules, r);
    this.#c(o, i);
  }
  /**
   * Apply visibility to a property element in the DOM
   * Includes retry logic if element not found immediately
   */
  #c(e, t, o = 0) {
    console.log(`[ConditionalProperties] Applying visibility to ${e}: ${t} (attempt ${o + 1})`);
    const r = (i) => {
      const s = [
        `umb-property[alias="${e}"]`,
        `umb-property[property-alias="${e}"]`,
        `[data-property-alias="${e}"]`,
        `[alias="${e}"]`
      ];
      for (const p of s) {
        const c = i.querySelector(p);
        if (c)
          return console.log(`[ConditionalProperties] Found property element using selector: ${p}`), c;
      }
      const a = i.querySelectorAll("*");
      for (const p of a)
        if (p.shadowRoot) {
          const c = r(p.shadowRoot);
          if (c)
            return c;
        }
      return null;
    }, n = r(document);
    if (!n) {
      if (o < 5) {
        const i = 200 * (o + 1);
        console.warn(`[ConditionalProperties] Property element not found for: ${e}, retrying in ${i}ms...`), setTimeout(() => {
          this.#c(e, t, o + 1);
        }, i);
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
    const t = this.#r.get(e);
    if (!t || t.size === 0)
      return [];
    const o = [];
    for (const r of t) {
      let n;
      for (const [i, s] of this.#t)
        if (s === r) {
          n = i;
          break;
        }
      if (n) {
        const i = this.#i.get(n) ?? n;
        o.push({ alias: n, name: i });
      }
    }
    return o;
  }
  destroy() {
    super.destroy(), this.#e?.destroy();
  }
}
export {
  T as UMB_GENERIC_CONDITIONAL_WORKSPACE_CONTEXT,
  E as UmbGenericConditionalWorkspaceContext,
  E as api,
  E as default
};
//# sourceMappingURL=generic-conditional-workspace.context--yn_uE6F.js.map
