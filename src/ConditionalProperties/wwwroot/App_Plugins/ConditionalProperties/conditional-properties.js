import { UMB_WORKSPACE_CONDITION_ALIAS as o } from "@umbraco-cms/backoffice/workspace";
const t = [
  {
    name: "Conditional Fields Entrypoint",
    alias: "ConditionalProperties.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-d0LBbOjY.js")
  }
], n = "Umb.Workspace.PropertyType", e = "Umb.Workspace.Document", a = "Umb.Workspace.Block", i = "Umb.Workspace.Media", s = [
  {
    type: "workspaceView",
    alias: "CndFlds.WorkspaceView.PropertyType.Settings",
    name: "Property Type Settings Workspace View",
    element: () => import("./property-workspace-view-settings.element-fH3132Oq.js"),
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
    api: () => import("./document-conditional-workspace.context-DS49IdA9.js"),
    conditions: [
      {
        alias: o,
        match: e
      }
    ]
  },
  {
    type: "workspaceContext",
    name: "Block Conditional Workspace Context",
    alias: "CndFlds.WorkspaceContext.Block.Conditional",
    api: () => import("./generic-conditional-workspace.context--yn_uE6F.js"),
    conditions: [
      {
        alias: o,
        match: a
      }
    ]
  },
  {
    type: "workspaceContext",
    name: "Media Conditional Workspace Context",
    alias: "CndFlds.WorkspaceContext.Media.Conditional",
    api: () => import("./generic-conditional-workspace.context--yn_uE6F.js"),
    conditions: [
      {
        alias: o,
        match: i
      }
    ]
  }
], p = [
  ...t,
  // ...dashboards,
  ...s
];
export {
  p as manifests
};
//# sourceMappingURL=conditional-properties.js.map
