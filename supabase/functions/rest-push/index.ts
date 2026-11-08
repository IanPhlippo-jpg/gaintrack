/**
 * rest-push: melding na de rusttijd, ook als de app op de achtergrond staat (web push naar de iPhone-web-app).
 *
 * POST { action: "schedule", subscription, delaySec, title, body, url }  → plant (vervangt een vorige planning)
 * POST { action: "cancel", endpoint }                                   → schrapt de geplande melding
 * POST { action: "continue", endpoint, version }                        → intern: verder wachten na 120 s
 *
 * Een edge function mag niet onbeperkt lopen; daarom wacht ze hooguit 120 s en roept ze zichzelf daarna opnieuw op.
 * Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY staan er standaard).
 */
import webpush from "npm:web-push@3.6.7";

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT")!, Deno.env.get("VAPID_PUBLIC_KEY")!, Deno.env.get("VAPID_PRIVATE_KEY")!);

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...CORS, "Content-Type": "application/json" } });

// Alleen echte pushdiensten (Apple, Google, Mozilla, Microsoft): de functie stuurt nooit verzoeken naar willekeurige adressen
const PUSH_HOSTS = [/\.push\.apple\.com$/, /^fcm\.googleapis\.com$/, /\.push\.services\.mozilla\.com$/, /\.notify\.windows\.com$/];
const geldigEndpoint = (e: unknown): e is string => {
  try {
    const u = new URL(String(e));
    return u.protocol === "https:" && PUSH_HOSTS.some((r) => r.test(u.hostname));
  } catch {
    return false;
  }
};

const db = (path: string, init: RequestInit = {}) =>
  fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });

type Job = { endpoint: string; subscription: webpush.PushSubscription; payload: { title: string; body: string; url: string }; send_at: string; version: string };

async function leesJob(endpoint: string): Promise<Job | null> {
  const r = await db(`push_jobs?endpoint=eq.${encodeURIComponent(endpoint)}&select=*`);
  const rows = (await r.json()) as Job[];
  return rows[0] ?? null;
}

const slaap = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wachtEnStuur(endpoint: string, version: string) {
  const job = await leesJob(endpoint);
  if (!job || job.version !== version) return; // geschrapt of vervangen
  const wacht = new Date(job.send_at).getTime() - Date.now();
  if (wacht > 120_000) {
    await slaap(115_000);
    // Verder wachten in een nieuwe oproep (een edge function heeft een maximale looptijd)
    await fetch(`${URL_}/functions/v1/rest-push`, { method: "POST", headers: { Authorization: `Bearer ${SERVICE}`, "Content-Type": "application/json" }, body: JSON.stringify({ action: "continue", endpoint, version }) });
    return;
  }
  if (wacht > 0) await slaap(wacht);
  const nu = await leesJob(endpoint);
  if (!nu || nu.version !== version) return;
  try {
    await webpush.sendNotification(nu.subscription, JSON.stringify(nu.payload), { TTL: 300, urgency: "high" });
  } catch (e) {
    console.error("push mislukt", (e as { statusCode?: number }).statusCode ?? e);
  }
  await db(`push_jobs?endpoint=eq.${encodeURIComponent(endpoint)}&version=eq.${encodeURIComponent(version)}`, { method: "DELETE" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Alleen POST." }, 405);
  const b = await req.json().catch(() => ({}));

  if (b.action === "cancel") {
    if (!geldigEndpoint(b.endpoint)) return json({ error: "Ongeldig toestel." }, 400);
    await db(`push_jobs?endpoint=eq.${encodeURIComponent(b.endpoint)}`, { method: "DELETE" });
    return json({ ok: true });
  }

  if (b.action === "continue") {
    if (!geldigEndpoint(b.endpoint) || typeof b.version !== "string") return json({ error: "Ongeldig." }, 400);
    EdgeRuntime.waitUntil(wachtEnStuur(b.endpoint, b.version));
    return json({ ok: true });
  }

  if (b.action === "schedule") {
    const sub = b.subscription;
    if (!sub || !geldigEndpoint(sub.endpoint) || typeof sub.keys?.p256dh !== "string" || typeof sub.keys?.auth !== "string") return json({ error: "Ongeldige inschrijving." }, 400);
    const delay = Math.round(Number(b.delaySec));
    if (!Number.isFinite(delay) || delay < 3 || delay > 1800) return json({ error: "Rusttijd tussen 3 s en 30 min." }, 400);
    const payload = { title: String(b.title ?? "Rust voorbij").slice(0, 80), body: String(b.body ?? "").slice(0, 200), url: String(b.url ?? "./").slice(0, 300) };
    const version = crypto.randomUUID();
    const r = await db("push_jobs?on_conflict=endpoint", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ endpoint: sub.endpoint, subscription: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } }, payload, send_at: new Date(Date.now() + delay * 1000).toISOString(), version }),
    });
    if (!r.ok) return json({ error: "Plannen mislukt." }, 500);
    EdgeRuntime.waitUntil(wachtEnStuur(sub.endpoint, version));
    return json({ ok: true });
  }

  return json({ error: "Onbekende actie." }, 400);
});
