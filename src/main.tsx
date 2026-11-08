import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { useStore } from "./store/useStore";
import { registerSW } from "virtual:pwa-register";
import { loadOffFoods } from "./data/foods-off";

// Service worker: nieuwe versie meteen activeren en de pagina herladen; bovendien op update controleren
// telkens de app (op het beginscherm) weer in beeld komt en elke 30 minuten.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (!registration) return;
    const check = () => registration.update().catch(() => {});
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
    setInterval(check, 30 * 60 * 1000);
  },
  onNeedRefresh() {
    void updateSW(true);
  },
});

if (import.meta.env.DEV) (window as unknown as { __gt: typeof useStore }).__gt = useStore;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// De supermarktproducten (duizenden) laden zodra de app rustig is, zodat zoeken meteen werkt.
const preloadFoods = () => void loadOffFoods();
if ("requestIdleCallback" in window) requestIdleCallback(preloadFoods, { timeout: 4000 });
else setTimeout(preloadFoods, 2500);
