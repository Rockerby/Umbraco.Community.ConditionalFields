// Re-export types from the generated API
export type {
	ConditionalOperator,
	LogicalOperator,
	ConditionalRule,
	PropertyConditionalConfiguration
} from '../api/index.js';

// Dependency information for a property (not in API)
export interface DependencyInfo {
	alias: string;
	name: string;
}
