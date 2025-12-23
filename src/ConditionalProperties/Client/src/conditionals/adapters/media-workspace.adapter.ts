import { UMB_MEDIA_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/media';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { IWorkspaceAdapter } from '../workspace-adapter.interface.js';
import { UmbContextConsumerController } from '@umbraco-cms/backoffice/context-api';

/**
 * Workspace adapter for Media workspaces
 */
export class MediaWorkspaceAdapter implements IWorkspaceAdapter {
	#mediaContext?: typeof UMB_MEDIA_WORKSPACE_CONTEXT.TYPE;
	#contextConsumer: UmbContextConsumerController<typeof UMB_MEDIA_WORKSPACE_CONTEXT.TYPE>;
	#resolveInit?: (value: boolean) => void;

	constructor(host: UmbControllerHost) {
		this.#contextConsumer = new UmbContextConsumerController(host, UMB_MEDIA_WORKSPACE_CONTEXT, (context) => {
			if (context) {
				console.log('[MediaWorkspaceAdapter] Media workspace context consumed');
				this.#mediaContext = context;
				if (this.#resolveInit) {
					this.#resolveInit(true);
					this.#resolveInit = undefined;
				}
			}
		});
	}

	async initialize(): Promise<boolean> {
		// If context already available, return immediately
		if (this.#mediaContext) {
			return true;
		}

		return new Promise((resolve) => {
			this.#resolveInit = resolve;

			// Timeout after 1 second if context not available
			setTimeout(() => {
				if (!this.#mediaContext) {
					console.warn('[MediaWorkspaceAdapter] Media workspace context not available');
					resolve(false);
				}
			}, 1000);
		});
	}

	getContext(): typeof UMB_MEDIA_WORKSPACE_CONTEXT.TYPE | undefined {
		return this.#mediaContext;
	}

	getContentTypeKey(): string | undefined {
		return this.#mediaContext?.getContentTypeUnique();
	}

	getPropertyValue(alias: string): any {
		const mediaData = this.#mediaContext?.getData();
		const propertyValue = mediaData?.values?.find((v: any) => v.alias === alias)?.value;
		return propertyValue;
	}

	setupPropertyObservers(_callback: () => void): void {
		// Observers are set up in the context using this.observe()
		// This adapter just provides access to the observables
		console.log('[MediaWorkspaceAdapter] setupPropertyObservers called (handled by context)');
	}

	async getPropertyStructures(): Promise<any[]> {
		if (!this.#mediaContext) {
			console.warn('[MediaWorkspaceAdapter] Context not available');
			return [];
		}

		try {
			const allProperties = await this.#mediaContext.structure?.getContentTypeProperties();
			return allProperties ?? [];
		} catch (error) {
			console.error('[MediaWorkspaceAdapter] Error getting property structures:', error);
			return [];
		}
	}

	getContentTypeName(): string {
		return 'Media';
	}

	destroy(): void {
		// Observers are managed by the context
		// Keep context consumer reference alive
		void this.#contextConsumer;
	}
}
