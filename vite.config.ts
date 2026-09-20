import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const dashboardOrigin = env.DASHBOARD_ORIGIN || "http://127.0.0.1:8787";

  return {
    plugins: [react()],
    server: {
      host: "127.0.0.1",
      port: 5173,
      proxy: {
        "/api": {
          target: dashboardOrigin,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: "127.0.0.1",
      port: 4173,
      proxy: {
        "/api": {
          target: dashboardOrigin,
          changeOrigin: true,
        },
      },
    },
  };
});
