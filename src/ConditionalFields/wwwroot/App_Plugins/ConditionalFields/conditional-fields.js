import { UMB_WORKSPACE_CONDITION_ALIAS as t } from "@umbraco-cms/backoffice/workspace";
const e = [
  {
    name: "Conditional Fields Entrypoint",
    alias: "ConditionalFields.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-d0LBbOjY.js")
  }
], n = "Umb.Workspace.PropertyType", i = "Umb.Workspace.Document", a = [
  {
    type: "workspaceView",
    alias: "CndFlds.WorkspaceView.PropertyType.Settings",
    name: "Property Type Settings Workspace View",
    element: () => import("./property-workspace-view-settings.element-BRm8HPqF.js"),
    weight: 950,
    meta: {
      label: "Conditional",
      //'#general_content',
      pathname: "conditional",
      icon: "icon-eye"
    },
    conditions: [
      {
        alias: t,
        match: n
      }
    ]
  },
  {
    type: "workspaceContext",
    name: "Document Conditional Workspace Context",
    alias: "CndFlds.WorkspaceContext.Document.Conditional",
    api: () => import("./document-conditional-workspace.context-DQX9WotS.js").then((o) => o.d),
    conditions: [
      {
        alias: t,
        match: i
      }
    ]
  }
], p = [
  ...e,
  // ...dashboards,
  ...a
];
export {
  p as manifests
};
//# sourceMappingURL=conditional-fields.js.map
