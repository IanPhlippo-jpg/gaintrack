import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

// Basispad: "/" voor Capacitor en Vercel, "/gaintrack/" voor GitHub Pages (via VITE_BASE).
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: {
        name: "GainTrack",
        short_name: "GainTrack",
        description: "Voeding, training en gewicht bijhouden met dagelijkse doelen",
        lang: "nl",
        theme_color: "#0E0B1D",
        background_color: "#0E0B1D",
        display: "standalone",
        orientation: "portrait",
        start_url: base,
        scope: base,
        id: base,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  build: { target: "es2020" },
});
