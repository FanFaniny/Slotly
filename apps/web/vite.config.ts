import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";


export default defineConfig(({ mode }) => {
  // Загружаем переменные из файлов .env / .env.production
  const env = loadEnv(mode, process.cwd(), "");

  // Локализация источников переменной
  console.log("=== [DEBUG VITE ENV] ===");
  console.log("1. From Docker System (process.env):", process.env.VITE_API_URL);
  console.log("2. From .env files (loadEnv):       ", env.VITE_API_URL);
  console.log("=== [END DEBUG] ===");

  return {
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
  };
});