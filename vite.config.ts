import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const packageJson = JSON.parse(readFileSync(resolve(__dirname, "package.json"), "utf8")) as { version?: string };
const frontendVersion = packageJson.version || "0.1.0";

function resolveGitShortSha() {
  try {
    return execSync("git rev-parse --short HEAD", {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "ignore"]
    })
      .toString()
      .trim();
  } catch {
    return "local";
  }
}

const frontendReleaseSha = process.env.VITE_RELEASE_SHA || process.env.RELEASE_SHA || resolveGitShortSha();
const frontendReleaseCreatedAt = process.env.VITE_RELEASE_CREATED_AT || process.env.RELEASE_CREATED_AT || new Date().toISOString();

export default defineConfig(({ mode }) => {
  const appBuildMeta = JSON.stringify(
    {
      version: frontendVersion,
      releaseSha: frontendReleaseSha,
      releaseCreatedAt: frontendReleaseCreatedAt,
      environment: mode
    },
    null,
    2
  );

  return {
    plugins: [
      react(),
      {
        name: "carnet-app-build-meta",
        configureServer(server) {
          server.middlewares.use("/app-build.json", (_request, response) => {
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.setHeader("Cache-Control", "no-store");
            response.end(appBuildMeta);
          });
        },
        generateBundle() {
          this.emitFile({
            type: "asset",
            fileName: "app-build.json",
            source: appBuildMeta
          });
        }
      },
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "penarol-192.png", "penarol-512.png"],
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
              src: "penarol-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any"
            },
            {
              src: "penarol-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any"
            }
          ]
        },
        workbox: {
          navigateFallback: "/frontend-carnet/index.html"
        }
      })
    ],
    define: {
      __APP_VERSION__: JSON.stringify(frontendVersion),
      __APP_RELEASE_SHA__: JSON.stringify(frontendReleaseSha),
      __APP_RELEASE_CREATED_AT__: JSON.stringify(frontendReleaseCreatedAt)
    },
    base: mode === "github-pages" ? "/frontend-carnet/" : "/",
    server: {
      port: 5192,
      strictPort: true
    },
    test: {
      exclude: ["src/shared/tests/**", "node_modules/**", "dist/**"]
    }
  };
});
