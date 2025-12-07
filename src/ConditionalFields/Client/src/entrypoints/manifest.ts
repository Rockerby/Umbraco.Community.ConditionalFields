export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Conditional Fields Entrypoint",
    alias: "ConditionalFields.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
