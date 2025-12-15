import type { ConditionalRule } from './types.js';

/**
 * Service for evaluating conditional rules
 * All methods are static as this is a stateless utility
 */
export class ConditionalEvaluator {
	/**
	 * Evaluates a single conditional rule against a value
	 * @param rule The conditional rule to evaluate
	 * @param value The value to test against
	 * @returns true if the rule passes, false otherwise
	 */
	static evaluateRule(rule: ConditionalRule, value: any): boolean {
		const { operator, value: ruleValue } = rule;

		// Convert value to string for comparison (handle null/undefined)
		const strValue = String(value ?? '');

		switch (operator) {
			case 'Equals':
				return strValue === ruleValue;

			case 'NotEquals':
				return strValue !== ruleValue;

			case 'Contains':
				return strValue.includes(ruleValue);

			case 'NotContains':
				return !strValue.includes(ruleValue);

			case 'GreaterThan': {
				const numValue = Number(strValue);
				const numRuleValue = Number(ruleValue);
				return !isNaN(numValue) && !isNaN(numRuleValue) && numValue > numRuleValue;
			}

			case 'LessThan': {
				const numValue = Number(strValue);
				const numRuleValue = Number(ruleValue);
				return !isNaN(numValue) && !isNaN(numRuleValue) && numValue < numRuleValue;
			}

			case 'IsEmpty':
				return !strValue || strValue.length === 0;

			case 'IsNotEmpty':
				return !!(strValue && strValue.length > 0);

			default: {
				console.warn(`Unknown operator: ${operator}`);
				return false;
			}
		}
	}

	/**
	 * Evaluates multiple conditional rules with AND/OR logic
	 * @param rules Array of conditional rules to evaluate
	 * @param values Map of field aliases to their current values
	 * @returns true if all rules pass (considering AND/OR logic), false otherwise
	 */
	static evaluateRules(rules: ConditionalRule[], values: Map<string, any>): boolean {
		if (!rules || rules.length === 0) {
			return true; // No rules means always visible
		}

		// Start with the first rule
		let result = this.evaluateRule(rules[0], values.get(rules[0].fieldAlias));

		// Process remaining rules with their logical operators
		for (let i = 1; i < rules.length; i++) {
			const rule = rules[i];
			const ruleResult = this.evaluateRule(rule, values.get(rule.fieldAlias));

			// Apply the logical operator (default to 'And' if not specified)
			if (rule.logicalOperator === 'Or') {
				result = result || ruleResult;
			} else {
				// Default to 'And'
				result = result && ruleResult;
			}
		}

		return result;
	}

	/**
	 * Gets all field aliases referenced in a set of rules
	 * @param rules Array of conditional rules
	 * @returns Set of unique field aliases
	 */
	static getReferencedFields(rules: ConditionalRule[]): Set<string> {
		const fields = new Set<string>();
		for (const rule of rules) {
			if (rule.fieldAlias) {
				fields.add(rule.fieldAlias);
			}
		}
		return fields;
	}
}
