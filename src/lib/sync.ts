/**
 * Synchronisatie van het weekklassement via Supabase (PostgREST), zodat spelers op verschillende gsm's
 * elkaar zien. Zonder configuratie (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) werkt alles lokaal.
 *
 * Tabellen (zie supabase/schema.sql):
 *   players(id text pk, name text, photo text, updated_at timestamptz)
 *   scores(account_id text, week date, xp int, workouts int, sets int, perfect_days int, updated_at timestamptz, pk(account_id, week))
 */
const URL_ = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const syncEnabled = () => !!URL_ && !!KEY;

const headers = (extra: Record<string, string> = {}) => ({
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  ...extra,
});

export interface RemotePlayer {
  id: string;
  name: string;
  photo: string | null;
  frame?: string | null;
  title?: string | null;
  updated_at?: string;
}

export interface RemoteScore {
  account_id: string;
  week: string;
  xp: number;
  workouts: number;
  sets: number;
  perfect_days: number;
  updated_at?: string;
}

async function upsert(table: string, row: object, onConflict: string): Promise<boolean> {
  try {
    const res = await fetch(`${URL_}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Speler (naam + foto) en weekscore naar de server; stil falen zonder netwerk. */
export async function pushWeekScore(player: RemotePlayer, score: RemoteScore): Promise<boolean> {
  if (!syncEnabled()) return false;
  const now = new Date().toISOString();
  const okPlayer = await upsert("players", { ...player, updated_at: now }, "id");
  const okScore = await upsert("scores", { ...score, updated_at: now }, "account_id,week");
  return okPlayer && okScore;
}

/** Alle scores van één week met de bijbehorende spelers. */
export async function fetchWeek(week: string): Promise<{ players: RemotePlayer[]; scores: RemoteScore[] } | null> {
  if (!syncEnabled()) return null;
  try {
    const [p, s] = await Promise.all([
      fetch(`${URL_}/rest/v1/players?select=id,name,photo,frame,title`, { headers: headers() }),
      fetch(`${URL_}/rest/v1/scores?week=eq.${week}&select=account_id,week,xp,workouts,sets,perfect_days`, { headers: headers() }),
    ]);
    if (!p.ok || !s.ok) return null;
    return { players: (await p.json()) as RemotePlayer[], scores: (await s.json()) as RemoteScore[] };
  } catch {
    return null;
  }
}
