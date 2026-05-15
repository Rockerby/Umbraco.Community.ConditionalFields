export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Conditional Fields Entrypoint",
    alias: "ConditionalProperties.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
