import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  build: {
    rollupOptions: {
      input: {
        popup: "popup.html",
        background: "src/background/index.ts",
        content: "src/content/index.ts",
      },
      output: {
        entryFileNames: (assetInfo) => {
          // Keep predictable names for manifest references
          const name = assetInfo.name?.replace(/\.\w+$/, "") || "entry";
          return `${name}.js`;
        },
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
});
