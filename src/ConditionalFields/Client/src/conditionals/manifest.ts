import { UMB_WORKSPACE_CONDITION_ALIAS } from '@umbraco-cms/backoffice/workspace';
export const UMB_PROPERTY_TYPE_WORKSPACE_ALIAS = 'Umb.Workspace.PropertyType';
export const UMB_DOCUMENT_WORKSPACE_ALIAS = 'Umb.Workspace.Document';

export const manifests: Array<UmbExtensionManifest> = [
  {
    type: 'workspaceView',
    alias: 'CndFlds.WorkspaceView.PropertyType.Settings',
    name: 'Property Type Settings Workspace View',
    element: () => import('./property-workspace-view-settings.element.js'),
    weight: 950,
    meta: {
      label: 'Conditional',//'#general_content',
      pathname: 'conditional',
      icon: 'icon-eye',
    },
    conditions: [
      {
        alias: UMB_WORKSPACE_CONDITION_ALIAS,
        match: UMB_PROPERTY_TYPE_WORKSPACE_ALIAS,
      },
    ],
  },
  {
    type: 'workspaceContext',
    name: 'Document Conditional Workspace Context',
    alias: 'CndFlds.WorkspaceContext.Document.Conditional',
    api: () => import('./document-conditional-workspace.context.js'),
    conditions: [
      {
        alias: UMB_WORKSPACE_CONDITION_ALIAS,
        match: UMB_DOCUMENT_WORKSPACE_ALIAS,
      },
    ],
  },
];
