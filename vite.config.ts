import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5178,
    strictPort: true,
    // the QA harness writes screenshots/profiles under .qa; a watch hit there reloads the page mid-test
    watch: { ignored: ["**/.qa/**", "**/node_modules/**", "**/dist/**"] },
  },
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 900,
  },
});
