import { UMB_WORKSPACE_CONDITION_ALIAS as o } from "@umbraco-cms/backoffice/workspace";
const t = [
  {
    name: "Conditional Fields Entrypoint",
    alias: "ConditionalProperties.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-d0LBbOjY.js")
  }
], n = "Umb.Workspace.PropertyType", e = "Umb.Workspace.Document", i = "Umb.Workspace.Block", a = [
  {
    type: "workspaceView",
    alias: "CndFlds.WorkspaceView.PropertyType.Settings",
    name: "Property Type Settings Workspace View",
    element: () => import("./property-workspace-view-settings.element-CEuXo6V8.js"),
    weight: 950,
    meta: {
      label: "Conditional",
      //'#general_content',
      pathname: "conditional",
      icon: "icon-eye"
    },
    conditions: [
      {
        alias: o,
        match: n
      }
    ]
  },
  {
    type: "workspaceContext",
    name: "Document Conditional Workspace Context",
    alias: "CndFlds.WorkspaceContext.Document.Conditional",
    api: () => import("./document-conditional-workspace.context-DUe0zQ54.js"),
    conditions: [
      {
        alias: o,
        match: e
      }
    ]
  },
  // Block conditional context (handles all block types: List, Grid, RTE)
  {
    type: "workspaceContext",
    name: "Block Conditional Workspace Context",
    alias: "CndFlds.WorkspaceContext.Block.Conditional",
    api: () => import("./block-conditional-workspace.context-BGWk4JSN.js"),
    conditions: [
      {
        alias: o,
        match: i
      }
    ]
  }
], c = [
  ...t,
  // ...dashboards,
  ...a
];
export {
  c as manifests
};
//# sourceMappingURL=conditional-properties.js.map
