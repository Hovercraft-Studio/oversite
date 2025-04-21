import { dirname, resolve } from "node:path";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default {
  plugins: [basicSsl()],
  server: {
    host: true,
    https: false,
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
        dashboard_example: resolve(__dirname, "examples/dashboard/js/index.html"),
      },
    },
  },
};
