import { c as s } from "./client.gen-D-YAh4px.js";
class o {
  /**
   * Evaluates a single conditional rule against a value
   * @param rule The conditional rule to evaluate
   * @param value The value to test against
   * @returns true if the rule passes, false otherwise
   */
  static evaluateRule(e, l) {
    const { operator: a, value: r } = e, t = String(l ?? "");
    switch (a) {
      case "Equals":
        return t === r;
      case "NotEquals":
        return t !== r;
      case "Contains":
        return t.includes(r);
      case "NotContains":
        return !t.includes(r);
      case "GreaterThan": {
        const n = Number(t), i = Number(r);
        return !isNaN(n) && !isNaN(i) && n > i;
      }
      case "LessThan": {
        const n = Number(t), i = Number(r);
        return !isNaN(n) && !isNaN(i) && n < i;
      }
      case "IsEmpty":
        return !t || t.length === 0;
      case "IsNotEmpty":
        return !!(t && t.length > 0);
      default:
        return console.warn(`Unknown operator: ${a}`), !1;
    }
  }
  /**
   * Evaluates multiple conditional rules with AND/OR logic
   * @param rules Array of conditional rules to evaluate
   * @param values Map of field aliases to their current values
   * @returns true if all rules pass (considering AND/OR logic), false otherwise
   */
  static evaluateRules(e, l) {
    if (!e || e.length === 0)
      return !0;
    let a = this.evaluateRule(e[0], l.get(e[0].fieldAlias));
    for (let r = 1; r < e.length; r++) {
      const t = e[r], n = this.evaluateRule(t, l.get(t.fieldAlias));
      t.logicalOperator === "Or" ? a = a || n : a = a && n;
    }
    return a;
  }
  /**
   * Gets all field aliases referenced in a set of rules
   * @param rules Array of conditional rules
   * @returns Set of unique field aliases
   */
  static getReferencedFields(e) {
    const l = /* @__PURE__ */ new Set();
    for (const a of e)
      a.fieldAlias && l.add(a.fieldAlias);
    return l;
  }
}
class m {
  static deleteConfiguration(e) {
    return (e.client ?? s).delete({
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
    return (e.client ?? s).get({
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
    return (e.client ?? s).post({
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
    return (e?.client ?? s).get({
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
export {
  m as C,
  o as a
};
//# sourceMappingURL=sdk.gen-DVSN0z9Q.js.map
