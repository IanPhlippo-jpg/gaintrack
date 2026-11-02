import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { execSync } from "node:child_process";

// Basispad: "/" voor Capacitor en Vercel, "/gaintrack/" voor GitHub Pages (via VITE_BASE).
const base = process.env.VITE_BASE ?? "/";

// Versie = korte git-hash + datum, zichtbaar onder het profiel zodat je ziet welke build op je toestel staat.
const gitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
})();
const appVersion = `${new Date().toISOString().slice(0, 10)} · ${gitHash}`;

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(appVersion) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Registratie gebeurt in main.tsx (virtual:pwa-register) met een updatecheck bij elke keer openen.
      injectRegister: null,
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
