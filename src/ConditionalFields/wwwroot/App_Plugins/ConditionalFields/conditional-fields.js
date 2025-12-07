import { UMB_WORKSPACE_CONDITION_ALIAS as e } from "@umbraco-cms/backoffice/workspace";
const t = [
  {
    name: "Conditional Fields Entrypoint",
    alias: "ConditionalFields.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-DcFFqYMe.js")
  }
], o = "Umb.Workspace.PropertyType";
console.log("in");
const i = [
  {
    type: "workspaceView",
    alias: "CndFlds.WorkspaceView.PropertyType.Settings",
    name: "Property Type Settings Workspace View",
    element: () => import("./property-workspace-view-settings.element-D53v-UbM.js"),
    weight: 950,
    meta: {
      label: "Conditional",
      //'#general_content',
      pathname: "conditional",
      icon: "icon-eye"
    },
    conditions: [
      {
        alias: e,
        match: o
      }
    ]
  }
], a = [
  ...t,
  // ...dashboards,
  ...i
];
export {
  a as manifests
};
//# sourceMappingURL=conditional-fields.js.map
