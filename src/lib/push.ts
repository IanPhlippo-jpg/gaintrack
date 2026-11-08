/**
 * Meldingen na de rusttijd (web push). Op de iPhone werkt dit alleen in de web-app op het beginscherm (iOS 16.4+).
 * De melding zelf wordt gepland door de Supabase-functie rest-push (zie supabase/functions/rest-push), want een
 * web-app op de achtergrond kan zelf geen timer laten lopen. Tik je op de melding, dan opent het snel-invulscherm.
 */
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";
// Publieke VAPID-sleutel (mag in de code; de geheime staat enkel als secret bij de Supabase-functie)
const VAPID_PUBLIC = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined) ?? "BBvJLgsRHfa6vFNPb_M8yUyQVyPki-XQS5VugYed3vBxpYVnIUBCBxcjdPIZcurAYnnhFFD9pdbP6faoFPSFTyg";
const SUB_KEY = "gt-push-sub";

export type PushStatus = "aan" | "uit" | "geweigerd" | "niet-ondersteund" | "beginscherm-nodig" | "geen-server";

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function pushSupport(): PushStatus | null {
  if (!URL_ || !KEY) return "geen-server";
  if (isIos() && !isStandalone()) return "beginscherm-nodig";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "niet-ondersteund";
  if (Notification.permission === "denied") return "geweigerd";
  return null;
}

function b64ToBytes(b64: string) {
  const s = atob((b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
}

function savedSub(): PushSubscriptionJSON | null {
  try {
    const v = localStorage.getItem(SUB_KEY);
    return v ? (JSON.parse(v) as PushSubscriptionJSON) : null;
  } catch {
    return null;
  }
}

/** Toestemming vragen en inschrijven. Moet vanuit een tik gebeuren (iOS vraagt anders geen toestemming). */
export async function enablePush(): Promise<PushStatus> {
  const blok = pushSupport();
  if (blok) return blok;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "geweigerd" : "uit";
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) }));
  try {
    localStorage.setItem(SUB_KEY, JSON.stringify(sub.toJSON()));
  } catch {
    /* geen opslag */
  }
  return "aan";
}

export async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    await (await reg.pushManager.getSubscription())?.unsubscribe();
    localStorage.removeItem(SUB_KEY);
  } catch {
    /* niets te doen */
  }
}

function post(body: object) {
  // keepalive: de app gaat net naar de achtergrond, het verzoek moet toch vertrekken
  return fetch(`${URL_}/functions/v1/rest-push`, { method: "POST", keepalive: true, headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
}

let gepland = false;

/** Melding plannen na de resterende rusttijd (de app gaat naar de achtergrond). */
export function scheduleRestPush(o: { delaySec: number; title: string; body: string; url: string }) {
  const sub = savedSub();
  if (!sub?.endpoint || !URL_ || o.delaySec < 3) return;
  gepland = true;
  void post({ action: "schedule", subscription: sub, ...o });
}

/** Geplande melding schrappen (de app is weer in beeld of de rust is gestopt). */
export function cancelRestPush() {
  const sub = savedSub();
  if (!gepland || !sub?.endpoint || !URL_) return;
  gepland = false;
  void post({ action: "cancel", endpoint: sub.endpoint });
}

/* ---- Snel invullen na een tik op de melding: ?log=<oefening>.<set> ---- */
let pending: string | null = null;
const LOG_EVENT = "gt-log";

export function setPendingLog(v: string | null) {
  pending = v;
  if (v) window.dispatchEvent(new Event(LOG_EVENT));
}
export const hasPendingLog = () => pending !== null;
export function takePendingLog(): { exIndex: number; setIndex: number } | null {
  const v = pending;
  pending = null;
  const m = v?.match(/^(\d+)\.(\d+)$/);
  return m ? { exIndex: Number(m[1]), setIndex: Number(m[2]) } : null;
}
export const onPendingLog = (fn: () => void) => {
  window.addEventListener(LOG_EVENT, fn);
  return () => window.removeEventListener(LOG_EVENT, fn);
};
