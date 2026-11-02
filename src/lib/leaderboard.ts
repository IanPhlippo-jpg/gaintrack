/**
 * Weekklassement van de accounts op dit toestel: XP, trainingen en perfecte dagen per week (ma-zo).
 * Het aangemelde account komt uit de live store, de andere accounts uit hun opgeslagen gegevens.
 */
import type { Account, Registry } from "@/lib/accounts";
import { readAccountState } from "@/lib/accounts";
import type { Workout, XpEvent } from "@/store/types";
import { shiftKey, weekStartKey } from "@/lib/date";
import { fetchWeek, pushWeekScore, syncEnabled } from "@/lib/sync";

export interface WeekScore {
  account: Pick<Account, "id" | "name" | "color" | "photo" | "frame" | "title">;
  xp: number;
  workouts: number;
  perfectDays: number;
  sets: number;
  isMe: boolean;
  /** Van de server (andere gsm) in plaats van dit toestel. */
  remote?: boolean;
}

type ScoreSource = { xpEvents?: XpEvent[]; workouts?: Workout[]; perfectDays?: Record<string, true> };

export function scoreForWeek(src: ScoreSource, weekStart: string): Omit<WeekScore, "account" | "isMe"> {
  const inWeek = (day: string) => weekStartKey(day) === weekStart;
  const xp = (src.xpEvents ?? []).filter((e) => inWeek(e.day)).reduce((a, e) => a + e.amount, 0);
  const done = (src.workouts ?? []).filter((w) => w.endedAt && inWeek(w.day));
  const sets = done.reduce((a, w) => a + w.exercises.reduce((b, ex) => b + ex.sets.filter((s) => s.done).length, 0), 0);
  const perfectDays = Object.keys(src.perfectDays ?? {}).filter(inWeek).length;
  return { xp, workouts: done.length, perfectDays, sets };
}

const sortRows = (rows: WeekScore[]) => rows.sort((a, b) => b.xp - a.xp || b.workouts - a.workouts || b.perfectDays - a.perfectDays || a.account.name.localeCompare(b.account.name));

/** Lokale accounts op dit toestel, aangevuld met spelers van de server (als synchronisatie aanstaat). */
export async function weekLeaderboard(registry: Registry, me: { id: string; state: ScoreSource }, weekStart: string): Promise<WeekScore[]> {
  const local: WeekScore[] = await Promise.all(
    registry.accounts.map(async (account) => {
      const src = account.id === me.id ? me.state : ((await readAccountState<ScoreSource>(account.id)) ?? {});
      return { account, isMe: account.id === me.id, ...scoreForWeek(src, weekStart) };
    }),
  );
  const remote = syncEnabled() ? await fetchWeek(weekStart) : null;
  if (!remote) return sortRows(local);
  const known = new Set(local.map((r) => r.account.id));
  const colors = ["#8B7CC7", "#5A3B8C", "#C9C2E3", "#3A3A52"];
  const extra: WeekScore[] = remote.players
    .filter((p) => !known.has(p.id))
    .map((p, i) => {
      const s = remote.scores.find((x) => x.account_id === p.id);
      return {
        account: { id: p.id, name: p.name, color: colors[i % colors.length], photo: p.photo ?? undefined, frame: p.frame ?? undefined, title: p.title ?? undefined },
        isMe: false,
        remote: true,
        xp: s?.xp ?? 0,
        workouts: s?.workouts ?? 0,
        sets: s?.sets ?? 0,
        perfectDays: s?.perfect_days ?? 0,
      };
    });
  return sortRows([...local, ...extra]);
}

/** Eigen weekscore (en naam/foto) naar de server sturen. */
export async function pushMyWeek(account: Pick<Account, "id" | "name" | "photo" | "frame" | "title">, state: ScoreSource, weekStart: string): Promise<boolean> {
  if (!syncEnabled()) return false;
  const s = scoreForWeek(state, weekStart);
  return pushWeekScore(
    { id: account.id, name: account.name, photo: account.photo ?? null, frame: account.frame ?? null, title: account.title ?? null },
    { account_id: account.id, week: weekStart, xp: s.xp, workouts: s.workouts, sets: s.sets, perfect_days: s.perfectDays },
  );
}

/** Maandag van de week die `offset` weken voor de huidige ligt (0 = deze week). */
export const weekStartWithOffset = (today: string, offset: number) => shiftKey(weekStartKey(today), -7 * offset);
