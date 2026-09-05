import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { posDbPlugin } from "./vite-plugin-pos-db.ts";

export default defineConfig({
  // Relative asset URLs: the packaged app loads via file:// (loadFile),
  // where absolute "/assets/..." paths resolve to file:///assets and 404.
  // "./" keeps both `vite dev` and the installed .deb/.AppImage working.
  base: "./",
  plugins: [react(), posDbPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist/renderer",
  },
});

