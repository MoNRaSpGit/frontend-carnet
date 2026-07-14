import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: mode === "github-pages" ? "/frontend-carnet/" : "/",
    test: {
      exclude: ["src/shared/tests/**", "node_modules/**", "dist/**"]
    }
  };
});
