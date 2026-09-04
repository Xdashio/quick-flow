import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { posDbPlugin } from "./vite-plugin-pos-db.ts";

export default defineConfig({
  plugins: [react(), posDbPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist/renderer",
  },
});

