import { defineConfig } from "vite";

// One ES module, served by the integration (custom_components/light_manager/frontend).
export default defineConfig({
  build: {
    lib: {
      entry: "src/light-manager-card.ts",
      formats: ["es"],
      fileName: () => "light-manager-card.js",
    },
    outDir: "../custom_components/light_manager/frontend",
    emptyOutDir: true,
    target: "es2022",
    minify: true,
    sourcemap: false,
  },
});
