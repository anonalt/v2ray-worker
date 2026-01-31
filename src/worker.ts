import type { Env, Config } from "./interfaces";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/|\/$/g, "");
      const lcPath = path.toLowerCase();

      /* =======================
         SUBSCRIPTIONS
         ======================= */
      if (["sub", "clash", "raw"].includes(lcPath)) {
        const { GetConfigList } = await import("./collector");
        const { ToYamlSubscription } = await import("./clash");
        const { ToBase64Subscription, ToRawSubscription } = await import("./sub");

        const configList: Array<Config> = await GetConfigList(url, env);

        if (lcPath === "clash") {
          return new Response(ToYamlSubscription(configList));
        }
        if (lcPath === "raw") {
          return new Response(ToRawSubscription(configList));
        }
        return new Response(ToBase64Subscription(configList));
      }

      /* =======================
         WS TUNNELING
         ======================= */
      if (lcPath === "vless-ws") {
        const { VlessOverWSHandler } = await import("./vless");
        return VlessOverWSHandler(request, url.hostname, env);
      }

      if (lcPath === "trojan-ws") {
        const { TrojanOverWSHandler } = await import("./trojan");
        return TrojanOverWSHandler(request, url.hostname, env);
      }

      /* =======================
         AUTH
         ======================= */
      if (lcPath === "login") {
        const { GetLogin, PostLogin } = await import("./auth");
        if (request.method === "GET") return GetLogin(request, env);
        if (request.method === "POST") return PostLogin(request, env);
      }

      /* =======================
         PANEL
         ======================= */
      if (!path) {
        const { GetPanel, PostPanel } = await import("./panel");
        if (request.method === "GET") return GetPanel(request, env);
        if (request.method === "POST") return PostPanel(request, env);
      }

      /* =======================
         PASSTHROUGH (proxy)
         ======================= */
      if (path) {
        return fetch(new Request(new URL("https://" + path), request));
      }

      return new Response("Invalid request", { status: 400 });
    } catch (err: any) {
      // This ensures you NEVER get silent 1101 again
      return new Response(
        "Worker error:\n" + (err?.stack || err?.message || String(err)),
        { status: 500 }
      );
    }
  },
};
