import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';

/**
 * Interface for workspace adapters
 * Abstracts workspace-specific data access behind a common interface
 */
export interface IWorkspaceAdapter {
	/**
	 * Get the content type key for the current workspace
	 */
	getContentTypeKey(): string | undefined;

	/**
	 * Get the value of a property by alias
	 * @param alias The property alias
	 */
	getPropertyValue(alias: string): any;

	/**
	 * Setup observers for property value changes
	 * @param callback Function to call when any property changes
	 */
	setupPropertyObservers(callback: () => void): void;

	/**
	 * Get all property structures for the current content type
	 */
	getPropertyStructures(): Promise<any[]>;

	/**
	 * Get a human-readable name for the content type (for logging)
	 */
	getContentTypeName(): string;

	/**
	 * Cleanup any resources
	 */
	destroy(): void;
}

/**
 * Base context for workspace adapters
 */
export interface IWorkspaceAdapterContext {
	host: UmbControllerHost;
}
