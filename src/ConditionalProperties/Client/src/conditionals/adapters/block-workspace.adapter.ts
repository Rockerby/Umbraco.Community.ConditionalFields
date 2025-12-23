import { UMB_BLOCK_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/block';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { IWorkspaceAdapter } from '../workspace-adapter.interface.js';
import { UmbContextConsumerController } from '@umbraco-cms/backoffice/context-api';

/**
 * Workspace adapter for Block workspaces (Block List, Block Grid, etc.)
 * Handles both content and settings properties
 */
export class BlockWorkspaceAdapter implements IWorkspaceAdapter {
	#blockContext?: typeof UMB_BLOCK_WORKSPACE_CONTEXT.TYPE;
	#contextConsumer: UmbContextConsumerController<typeof UMB_BLOCK_WORKSPACE_CONTEXT.TYPE>;
	#resolveInit?: (value: boolean) => void;

	constructor(host: UmbControllerHost) {
		this.#contextConsumer = new UmbContextConsumerController(host, UMB_BLOCK_WORKSPACE_CONTEXT, (context) => {
			if (context) {
				console.log('[BlockWorkspaceAdapter] Block workspace context consumed');
				this.#blockContext = context;
				if (this.#resolveInit) {
					this.#resolveInit(true);
					this.#resolveInit = undefined;
				}
			}
		});
	}

	async initialize(): Promise<boolean> {
		// If context already available, return immediately
		if (this.#blockContext) {
			return true;
		}

		return new Promise((resolve) => {
			this.#resolveInit = resolve;

			// Timeout after 1 second if context not available
			setTimeout(() => {
				if (!this.#blockContext) {
					console.warn('[BlockWorkspaceAdapter] Block workspace context not available');
					resolve(false);
				}
			}, 1000);
		});
	}

	getContext(): typeof UMB_BLOCK_WORKSPACE_CONTEXT.TYPE | undefined {
		return this.#blockContext;
	}

	getContentTypeKey(): string | undefined {
		// For blocks, we return the content content type ID
		// In the future, we might need to handle settings separately
		return this.#blockContext?.content?.getContentTypeId();
	}

	getPropertyValue(alias: string): any {
		if (!this.#blockContext) {
			return undefined;
		}

		// Try to get value from content first
		let value = this.#blockContext.content?.getPropertyValue(alias);

		// If not found in content, try settings
		if (value === undefined && this.#blockContext.settings) {
			value = this.#blockContext.settings.getPropertyValue(alias);
		}

		return value;
	}

	setupPropertyObservers(_callback: () => void): void {
		// Observers are set up in the context using this.observe()
		// This adapter just provides access to the observables
		console.log('[BlockWorkspaceAdapter] setupPropertyObservers called (handled by context)');
	}

	async getPropertyStructures(): Promise<any[]> {
		if (!this.#blockContext) {
			console.warn('[BlockWorkspaceAdapter] Context not available');
			return [];
		}

		try {
			const properties: any[] = [];

			// Get content properties
			if (this.#blockContext.content?.structure) {
				const contentProperties = await this.#blockContext.content.structure.getContentTypeProperties();
				if (contentProperties) {
					properties.push(...contentProperties);
				}
			}

			// Get settings properties
			if (this.#blockContext.settings?.structure) {
				const settingsProperties = await this.#blockContext.settings.structure.getContentTypeProperties();
				if (settingsProperties) {
					properties.push(...settingsProperties);
				}
			}

			return properties;
		} catch (error) {
			console.error('[BlockWorkspaceAdapter] Error getting property structures:', error);
			return [];
		}
	}

	getContentTypeName(): string {
		return 'Block';
	}

	destroy(): void {
		// Observers are managed by the context
		// Keep context consumer reference alive
		void this.#contextConsumer;
	}
}
