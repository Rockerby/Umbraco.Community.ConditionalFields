import { UMB_AUTH_CONTEXT as s } from "@umbraco-cms/backoffice/auth";
import { c as i } from "./client.gen-D-YAh4px.js";
const l = (n, e) => {
  console.log("Hello from my extension 🎉"), n.consumeContext(s, async (t) => {
    const o = t?.getOpenApiConfiguration();
    console.log("setting config", o), i.setConfig({
      auth: o?.token ?? void 0,
      baseUrl: o?.base ?? "",
      credentials: o?.credentials ?? "same-origin"
    });
  });
}, g = (n, e) => {
  console.log("Goodbye from my extension 👋");
};
export {
  l as onInit,
  g as onUnload
};
//# sourceMappingURL=entrypoint-d0LBbOjY.js.map
