import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  base: "/salary/",
  plugins: [
    react(),
    VitePWA({
      injectRegister: null,
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      manifest: {
        name: "HR Portal",
        short_name: "HR App",
        start_url: "/salary/",
        scope: "/salary/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  // Allow `--host` and external devices to reach the dev server
  server: {
    host: true, // equivalent to 0.0.0.0
    port: 5175,
    strictPort: true,
    proxy: {
      "/arieshrms-api": {
        target: "https://www.efftime.com/webservices/arieshrms/",
        changeOrigin: true,
        secure: true,
        rewrite: (requestPath) =>
          requestPath.replace(/^\/arieshrms-api/, ""),
      },
    },
  },
});
