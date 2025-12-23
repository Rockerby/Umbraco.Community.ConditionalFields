import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { IWorkspaceAdapter } from '../workspace-adapter.interface.js';
import { UmbContextConsumerController } from '@umbraco-cms/backoffice/context-api';

/**
 * Workspace adapter for Document workspaces
 */
export class DocumentWorkspaceAdapter implements IWorkspaceAdapter {
	#documentContext?: typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE;
	#contextConsumer: UmbContextConsumerController<typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE>;
	#resolveInit?: (value: boolean) => void;

	constructor(host: UmbControllerHost) {
		this.#contextConsumer = new UmbContextConsumerController(host, UMB_DOCUMENT_WORKSPACE_CONTEXT, (context) => {
			if (context) {
				console.log('[DocumentWorkspaceAdapter] Document workspace context consumed');
				this.#documentContext = context;
				if (this.#resolveInit) {
					this.#resolveInit(true);
					this.#resolveInit = undefined;
				}
			}
		});
	}

	async initialize(): Promise<boolean> {
		// If context already available, return immediately
		if (this.#documentContext) {
			return true;
		}

		return new Promise((resolve) => {
			this.#resolveInit = resolve;

			// Timeout after 1 second if context not available
			setTimeout(() => {
				if (!this.#documentContext) {
					console.warn('[DocumentWorkspaceAdapter] Document workspace context not available');
					resolve(false);
				}
			}, 1000);
		});
	}

	getContext(): typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE | undefined {
		return this.#documentContext;
	}

	getContentTypeKey(): string | undefined {
		return this.#documentContext?.getContentTypeUnique();
	}

	getPropertyValue(alias: string): any {
		const documentData = this.#documentContext?.getData();
		const propertyValue = documentData?.values?.find((v: any) => v.alias === alias)?.value;
		return propertyValue;
	}

	setupPropertyObservers(_callback: () => void): void {
		// Observers are set up in the context using this.observe()
		// This adapter just provides access to the observables
		console.log('[DocumentWorkspaceAdapter] setupPropertyObservers called (handled by context)');
	}

	async getPropertyStructures(): Promise<any[]> {
		if (!this.#documentContext) {
			console.warn('[DocumentWorkspaceAdapter] Context not available');
			return [];
		}

		try {
			const allProperties = await this.#documentContext.structure?.getContentTypeProperties();
			return allProperties ?? [];
		} catch (error) {
			console.error('[DocumentWorkspaceAdapter] Error getting property structures:', error);
			return [];
		}
	}

	getContentTypeName(): string {
		return 'Document';
	}

	destroy(): void {
		// Observers are managed by the context
		// Keep context consumer reference alive
		void this.#contextConsumer;
	}
}
