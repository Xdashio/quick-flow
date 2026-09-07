import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { posDbPlugin } from "./vite-plugin-pos-db.ts";

export default defineConfig(({ command }) => ({
  // Use "./" for Electron (file:// protocol) and "/" for web hosting.
  // The WEB_BUILD env flag or `vite build` without electron wrapper triggers web mode.
  base: process.env.WEB_BUILD === "1" ? "/" : "./",
  plugins: [
    react(),
    // posDbPlugin provides the local SQLite dev server middleware — only
    // needed during `vite dev`. It is NOT included in production builds.
    ...(command === "serve" ? [posDbPlugin()] : []),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist/renderer",
  },
}));
