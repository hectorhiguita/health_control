import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Se publica en la raíz de CloudFront
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          amplify: ["aws-amplify", "aws-amplify/auth", "aws-amplify/utils"],
          graficas: ["recharts"],
        },
      },
    },
  },
});
