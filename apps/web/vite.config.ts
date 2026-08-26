import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

console.log("=== [2] VITE CONFIG ENV CHECK ===", process.env.VITE_API_URL);

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/trpc": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});