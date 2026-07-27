import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base = "/health_control/" porque se publica en GitHub Pages bajo esa ruta.
// Para Firebase Hosting o dominio propio: DEPLOY_TARGET=firebase npm run build
export default defineConfig({
  plugins: [react()],
  base: process.env.DEPLOY_TARGET === "firebase" ? "/" : "/health_control/",
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          graficas: ["recharts"],
        },
      },
    },
  },
});
