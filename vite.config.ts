import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const dashboardOrigin = env.DASHBOARD_ORIGIN || "http://127.0.0.1:8787";

  return {
    base: "/drama-studio-web/",
    plugins: [
      react(),
      {
        name: "redirect-root-to-base",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = (req as { url?: string }).url;
            if (url === "/" || url === "/index.html") {
              res.statusCode = 302;
              res.setHeader("Location", "/drama-studio-web/");
              res.end();
              return;
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = (req as { url?: string }).url;
            if (url === "/" || url === "/index.html") {
              res.statusCode = 302;
              res.setHeader("Location", "/drama-studio-web/");
              res.end();
              return;
            }
            next();
          });
        },
      },
    ],
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
