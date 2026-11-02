import type { Challenge, ChallengeType } from "@/store/types";

/** XP-beloningen */
export const XP = {
  meal: 10,
  water: 5,
  weight: 25,
  workout: 60,
  set: 2,
  pr: 40,
  perfectDay: 100,
  challenge: 50,
  streakBonusPerDay: 5,
} as const;

/**
 * XP nodig voor een level: 600 × (level − 1)^1,8 (afgerond op 10).
 * Level 2 bij 600 XP, 3 bij 2.090, 5 bij 7.300, 10 bij 31.200, 15 bij 69.400, 20 bij 120.800.
 * Een perfecte dag levert zo'n 300-400 XP: level 10 vraagt dus ruim twee maanden volhouden, level 20 bijna een jaar.
 */
export const xpForLevel = (level: number) => (level <= 1 ? 0 : Math.round((600 * (level - 1) ** 1.8) / 10) * 10);
export const levelFromXp = (xp: number) => {
  let level = 1;
  while (xpForLevel(level + 1) <= Math.max(0, xp)) level++;
  return level;
};
export const levelProgress = (xp: number) => {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, start, next, current: xp - start, needed: next - start, pct: Math.min(100, ((xp - start) / (next - start)) * 100) };
};

export const LEVEL_TITLES = [
  "Beginner", "Rookie", "Recruut", "Doorzetter", "Atleet", "Krachtpatser", "Machine", "Beest", "Titaan", "Legende",
];
export const levelTitle = (level: number) => LEVEL_TITLES[Math.min(LEVEL_TITLES.length - 1, Math.floor((level - 1) / 2))];

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-meal", name: "Eerste hap", desc: "Log je eerste maaltijd", icon: "🍽️" },
  { id: "first-workout", name: "Eerste training", desc: "Rond een training af", icon: "🏋️" },
  { id: "first-weight", name: "Op de weegschaal", desc: "Geef je gewicht in", icon: "⚖️" },
  { id: "perfect-day", name: "Perfecte dag", desc: "Haal al je dagdoelen", icon: "⭐" },
  { id: "streak-3", name: "Op dreef", desc: "3 perfecte dagen op rij", icon: "🔥" },
  { id: "streak-7", name: "Week van staal", desc: "7 perfecte dagen op rij", icon: "💎" },
  { id: "streak-30", name: "Onstuitbaar", desc: "30 perfecte dagen op rij", icon: "👑" },
  { id: "workouts-10", name: "Tiental", desc: "10 trainingen afgewerkt", icon: "🔟" },
  { id: "workouts-50", name: "Halve eeuw", desc: "50 trainingen afgewerkt", icon: "🏆" },
  { id: "first-pr", name: "Nieuw record", desc: "Zet je eerste PR", icon: "📈" },
  { id: "pr-10", name: "Recordjager", desc: "10 persoonlijke records", icon: "🚀" },
  { id: "volume-10t", name: "10 ton", desc: "10.000 kg volume in één training", icon: "🐘" },
  { id: "protein-7", name: "Eiwitkoning", desc: "7 dagen op rij eiwitdoel gehaald", icon: "🥩" },
  { id: "weigh-14", name: "Trouwe weger", desc: "14 dagen op rij gewogen", icon: "📅" },
  { id: "level-5", name: "Level 5", desc: "Bereik level 5", icon: "🎖️" },
  { id: "level-10", name: "Level 10", desc: "Bereik level 10", icon: "🥇" },
  { id: "challenges-10", name: "Uitdager", desc: "10 dagelijkse uitdagingen gehaald", icon: "🎯" },
  { id: "meals-100", name: "Honderd maaltijden", desc: "100 maaltijden gelogd", icon: "📒" },
];

const CHALLENGE_POOL: { type: ChallengeType; title: string; desc: (t: number) => string; target: number; xp: number }[] = [
  { type: "protein_plus", title: "Eiwitboost", desc: (t) => `Haal ${t} g eiwit boven je dagdoel`, target: 20, xp: 50 },
  { type: "all_meals", title: "Alles gelogd", desc: () => "Log ontbijt, lunch, diner én een snack", target: 4, xp: 40 },
  { type: "water_plus", title: "Hydratatie", desc: (t) => `Drink ${t / 1000} liter water`, target: 3000, xp: 40 },
  { type: "sets", title: "Setjager", desc: (t) => `Werk vandaag minstens ${t} sets af`, target: 20, xp: 60 },
  { type: "volume", title: "Zware dag", desc: (t) => `Til vandaag ${t.toLocaleString("nl-BE")} kg totaal volume`, target: 8000, xp: 70 },
  { type: "weigh", title: "Vroege weging", desc: () => "Geef je gewicht in vóór 10 uur", target: 10, xp: 30 },
  { type: "workout_early", title: "Vroege vogel", desc: () => "Start je training vóór 9 uur", target: 9, xp: 60 },
  { type: "kcal_exact", title: "Precisiewerk", desc: (t) => `Eindig binnen ${t} kcal van je calorie-doel`, target: 75, xp: 60 },
];

/** Deterministische dagelijkse uitdaging op basis van de datum */
export function challengeForDay(day: string, hasWorkoutToday: boolean): Challenge {
  let seed = 0;
  for (const ch of day) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = CHALLENGE_POOL.filter((c) => (hasWorkoutToday ? true : !["sets", "volume", "workout_early"].includes(c.type)));
  const pick = pool[seed % pool.length];
  return { day, type: pick.type, title: pick.title, desc: pick.desc(pick.target), target: pick.target, xp: pick.xp };
}

/** Motiverende boodschappen op basis van voortgang */
export function motivation(pct: number, streak: number): string {
  if (pct >= 100) return streak > 1 ? `Dag ${streak} op rij perfect. Onstuitbaar!` : "Alle doelen gehaald. Zo bouw je momentum.";
  if (pct >= 75) return "Bijna daar. Eén doel nog en de dag is perfect.";
  if (pct >= 50) return "Halverwege. Niet lossen nu.";
  if (pct > 0) return "Goed begonnen. Blijf vinken.";
  return streak > 0 ? `Je streak van ${streak} staat op het spel. Begin met één doel.` : "Nieuwe dag, nieuwe kans. Begin met één doel.";
}
