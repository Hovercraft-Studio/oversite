import { dirname, resolve } from "node:path";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default {
  plugins: [basicSsl()],
  server: {
    host: true,
    https: false,
    // Vite always serves dev over https (basicSsl above), so any websocket/fetch to the
    // plain-http relay on :3003 is mixed content and gets silently blocked by the browser
    // on anything but localhost. Proxy both same-origin so the browser only ever sees
    // wss://.../ws and https://.../api -- see docs/references/deployment.md "Running Behind HTTPS".
    proxy: {
      "/ws": { target: "ws://localhost:3003", ws: true },
      "/api": "http://localhost:3003",
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  resolve: {
    alias: {
      // "@": resolve(__dirname, "./src"),
      "@src": resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        app_store_demo: resolve(__dirname, "app-store-demo/index.html"),
        app_store_monitor: resolve(__dirname, "app-store-monitor/index.html"),
        dashboard: resolve(__dirname, "dashboard/index.html"),
        dashboard_example: resolve(__dirname, "examples/dashboard/js-frontend/index.html"),
        auth_example: resolve(__dirname, "examples/auth-form/index.html"),
        pico_theme: resolve(__dirname, "examples/pico-theme/index.html"),
        login: resolve(__dirname, "login/index.html"),
      },
    },
  },
};
