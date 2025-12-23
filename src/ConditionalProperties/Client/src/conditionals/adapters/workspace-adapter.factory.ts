import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import type { IWorkspaceAdapter } from '../workspace-adapter.interface.js';
import { BlockWorkspaceAdapter } from './block-workspace.adapter.js';
import { DocumentWorkspaceAdapter } from './document-workspace.adapter.js';
import { MediaWorkspaceAdapter } from './media-workspace.adapter.js';

/**
 * Factory function to create the appropriate workspace adapter based on available context
 * Tries to detect workspace type by attempting to consume each context type
 *
 * @param host The controller host
 * @returns Promise resolving to an adapter instance, or null if no compatible workspace found
 */
export async function createWorkspaceAdapter(host: UmbControllerHost): Promise<IWorkspaceAdapter | null> {
	console.log('[WorkspaceAdapterFactory] Detecting workspace type...');

	// Try Block workspace first (most common for modals)
	const blockAdapter = new BlockWorkspaceAdapter(host);
	if (await blockAdapter.initialize()) {
		console.log('[WorkspaceAdapterFactory] Using Block workspace adapter');
		return blockAdapter;
	}
	blockAdapter.destroy();

	// Try Document workspace
	const documentAdapter = new DocumentWorkspaceAdapter(host);
	if (await documentAdapter.initialize()) {
		console.log('[WorkspaceAdapterFactory] Using Document workspace adapter');
		return documentAdapter;
	}
	documentAdapter.destroy();

	// Try Media workspace
	const mediaAdapter = new MediaWorkspaceAdapter(host);
	if (await mediaAdapter.initialize()) {
		console.log('[WorkspaceAdapterFactory] Using Media workspace adapter');
		return mediaAdapter;
	}
	mediaAdapter.destroy();

	console.warn('[WorkspaceAdapterFactory] No compatible workspace context found');
	return null;
}
