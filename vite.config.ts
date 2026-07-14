import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "peñarol.jpg"],
        manifest: {
          name: "Equipo de Peñarol",
          short_name: "Carnet",
          description: "Registro de carnet de jugadores con vencimientos y control rapido.",
          theme_color: "#0f172a",
          background_color: "#f8fafc",
          display: "standalone",
          scope: "./",
          start_url: "./",
          icons: [
            {
              src: "peñarol.jpg",
              sizes: "192x192",
              type: "image/jpeg",
              purpose: "any"
            },
            {
              src: "peñarol.jpg",
              sizes: "512x512",
              type: "image/jpeg",
              purpose: "any"
            }
          ]
        },
        workbox: {
          navigateFallback: "/frontend-carnet/index.html"
        }
      })
    ],
    base: mode === "github-pages" ? "/frontend-carnet/" : "/",
    test: {
      exclude: ["src/shared/tests/**", "node_modules/**", "dist/**"]
    }
  };
});
