import { VlessOverWSHandler } from "./vless";
import { TrojanOverWSHandler } from "./trojan";
import { GetPanel, PostPanel } from "./panel";
import { GetLogin, PostLogin } from "./auth";
import { GetConfigList } from "./collector";
import { ToYamlSubscription } from "./clash";
import { ToBase64Subscription, ToRawSubscription } from "./sub";
// import { ToCustomConfigSubscription } from "./custom"
import { Env, Config } from "./interfaces";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url: URL = new URL(request.url);

    // Trim only the leading/trailing slash ("/panel" -> "panel", "/" -> "")
    const path: string = url.pathname.replace(/^\/|\/$/g, "");
    const lcPath = path.toLowerCase();

    // Explicit panel route
    if (lcPath === "panel") {
      if (request.method === "GET") return GetPanel(request, env);
      if (request.method === "POST") return PostPanel(request, env);
      return new Response("Method not allowed", { status: 405 });
    }

    // Subscription routes
    if (["sub", "clash", /*"custom",*/ "raw"].includes(lcPath)) {
      const configList: Array<Config> = await GetConfigList(url, env);

      if (lcPath === "clash") {
        return new Response(ToYamlSubscription(configList));
        // } else if (lcPath === "custom") {
        //   return new Response(ToCustomConfigSubscription(configList));
      } else if (lcPath === "raw") {
        return new Response(ToRawSubscription(configList));
      } else {
        return new Response(ToBase64Subscription(configList));
      }
    }

    // WS routes
    if (lcPath === "vless-ws") {
      return VlessOverWSHandler(request, url.hostname, env);
    }

    if (lcPath === "trojan-ws") {
      return TrojanOverWSHandler(request, url.hostname, env);
    }

    // Login route
    if (lcPath === "login") {
      if (request.method === "GET") return GetLogin(request, env);
      if (request.method === "POST") return PostLogin(request, env);
      return new Resp
