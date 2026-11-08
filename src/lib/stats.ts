import { hasPerk } from "@/lib/unlocks";
import type { AppState } from "@/store/useStore";
import type { Challenge, Exercise, SetLog, Workout } from "@/store/types";
import { SEED_EXERCISES } from "@/data/exercises";
import { SEED_FOODS } from "@/data/foods";
import { lastNDays, shiftKey, todayKey, weekdayOf, daysBetween } from "./date";
import { bestSet, e1rm, workoutSets, workoutVolume } from "./calc";
import { challengeForDay } from "./gamification";
import { coinsEarned } from "./shop";

export const allExercises = (s: Pick<AppState, "customExercises">): Exercise[] => [...s.customExercises, ...SEED_EXERCISES];
export const exerciseById = (s: Pick<AppState, "customExercises">, id: string) => allExercises(s).find((e) => e.id === id);
export const allFoods = (s: Pick<AppState, "customFoods">) => [...s.customFoods, ...SEED_FOODS];

export interface DayNutrition { kcal: number; protein: number; carbs: number; fat: number; entries: AppState["foodLog"] }
export function dayNutrition(s: Pick<AppState, "foodLog">, day: string): DayNutrition {
  const entries = s.foodLog.filter((e) => e.day === day);
  return entries.reduce(
    (acc, e) => ({ ...acc, kcal: acc.kcal + e.kcal, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0, entries },
  );
}

export const totalXp = (s: Pick<AppState, "xpEvents">) => s.xpEvents.reduce((a, e) => a + e.amount, 0);
/** Coins die je nu kunt uitgeven. */
export const coinBalance = (s: Pick<AppState, "xpEvents" | "coinsSpent">) => Math.max(0, coinsEarned(totalXp(s)) - (s.coinsSpent ?? 0));
export const xpOnDay = (s: Pick<AppState, "xpEvents">, day: string) => s.xpEvents.filter((e) => e.day === day).reduce((a, e) => a + e.amount, 0);

export const workoutsOnDay = (s: Pick<AppState, "workouts">, day: string) => s.workouts.filter((w) => w.day === day);
export const routinesForDay = (s: Pick<AppState, "routines">, day: string) => s.routines.filter((r) => r.days.includes(weekdayOf(day)));

export interface DailyGoal { id: string; label: string; value: number; target: number; unit: string; done: boolean; pct: number; icon: string; hint: string }

/** De dagdoelen die samen een "perfecte dag" vormen */
export function dailyGoals(s: AppState, day: string): DailyGoal[] {
  const n = dayNutrition(s, day);
  const g = s.goals;
  const water = s.water[day] ?? 0;
  const weighed = s.weights.some((w) => w.day === day);
  const workouts = workoutsOnDay(s, day);
  const planned = routinesForDay(s, day);
  const restDay = planned.length === 0;

  const kcalOk = n.kcal > 0 && Math.abs(n.kcal - g.kcal) <= g.kcal * 0.07;
  const goals: DailyGoal[] = [
    {
      id: "kcal", label: "Calorieën", value: n.kcal, target: g.kcal, unit: "kcal", icon: "🔥",
      done: kcalOk, pct: Math.min(100, (n.kcal / g.kcal) * 100),
      hint: n.kcal === 0 ? "Nog niets gelogd" : kcalOk ? "Binnen 7% van je doel" : n.kcal < g.kcal ? `Nog ${Math.round(g.kcal - n.kcal)} kcal te gaan` : `${Math.round(n.kcal - g.kcal)} kcal boven doel`,
    },
    {
      id: "protein", label: "Eiwit", value: n.protein, target: g.protein, unit: "g", icon: "🥩",
      done: n.protein >= g.protein, pct: Math.min(100, (n.protein / g.protein) * 100),
      hint: n.protein >= g.protein ? "Eiwitdoel gehaald" : `Nog ${Math.round(g.protein - n.protein)} g eiwit`,
    },
    {
      id: "water", label: "Water", value: water / 1000, target: g.waterMl / 1000, unit: "l", icon: "💧",
      done: water >= g.waterMl, pct: Math.min(100, (water / g.waterMl) * 100),
      hint: water >= g.waterMl ? "Goed gehydrateerd" : `Nog ${((g.waterMl - water) / 1000).toLocaleString("nl-BE", { maximumFractionDigits: 2 })} l`,
    },
    {
      id: "weight", label: "Gewicht", value: weighed ? 1 : 0, target: 1, unit: "", icon: "⚖️",
      done: weighed, pct: weighed ? 100 : 0, hint: weighed ? "Vandaag gewogen" : "Weeg je 's ochtends",
    },
    {
      id: "workout", label: restDay ? "Rustdag" : "Training", value: workouts.length, target: 1, unit: "", icon: restDay ? "😴" : "🏋️",
      done: restDay || workouts.length > 0, pct: restDay || workouts.length > 0 ? 100 : 0,
      hint: restDay ? (workouts.length ? "Extra training gedaan!" : "Geen training gepland") : workouts.length ? "Training afgewerkt" : `Gepland: ${planned.map((p) => p.name.split(" (")[0]).join(", ")}`,
    },
  ];
  return goals;
}

export const isPerfectDay = (s: AppState, day: string) => dailyGoals(s, day).every((g) => g.done);

/** Huidige streak van perfecte dagen (vandaag telt mee als hij al perfect is, anders start de telling gisteren) */
export function currentStreak(s: AppState): number {
  const today = todayKey();
  let day = s.perfectDays[today] || isPerfectDay(s, today) ? today : shiftKey(today, -1);
  // Voordeel "Streak-schild" (level 5+): een gemiste dag per 7 dagen telt niet als onderbreking.
  const shield = hasPerk(totalXp(s), "perk-streak-shield");
  let streak = 0;
  let lastShield: string | null = null;
  for (;;) {
    if (s.perfectDays[day]) {
      streak++;
      day = shiftKey(day, -1);
      continue;
    }
    if (shield && streak > 0 && day !== today && (!lastShield || daysBetween(day, lastShield) >= 7) && s.perfectDays[shiftKey(day, -1)]) {
      lastShield = day;
      day = shiftKey(day, -1);
      continue;
    }
    break;
  }
  return streak;
}

export function longestStreak(s: AppState): number {
  const days = Object.keys(s.perfectDays).sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const d of days) {
    run = prev && shiftKey(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

/** Beste e1RM per oefening, met de set en de dag */
export function personalRecords(s: AppState): Record<string, { e1rm: number; set: SetLog; day: string }> {
  const out: Record<string, { e1rm: number; set: SetLog; day: string }> = {};
  for (const w of s.workouts) {
    for (const ex of w.exercises) {
      const b = bestSet(ex.sets);
      if (!b) continue;
      const v = e1rm(b.weight, b.reps);
      if (!out[ex.exerciseId] || v > out[ex.exerciseId].e1rm) out[ex.exerciseId] = { e1rm: v, set: b, day: w.day };
    }
  }
  return out;
}

/** Laatste prestatie (gedane sets) van een oefening */
export function lastPerformance(s: Pick<AppState, "workouts">, exerciseId: string): { sets: SetLog[]; day: string } | null {
  for (let i = s.workouts.length - 1; i >= 0; i--) {
    const ex = s.workouts[i].exercises.find((x) => x.exerciseId === exerciseId);
    if (ex && ex.sets.length) return { sets: ex.sets, day: s.workouts[i].day };
  }
  return null;
}

/** Verloop van beste e1RM per training voor een oefening */
export function strengthHistory(s: Pick<AppState, "workouts">, exerciseId: string) {
  return s.workouts
    .map((w) => {
      const ex = w.exercises.find((x) => x.exerciseId === exerciseId);
      const b = ex ? bestSet(ex.sets) : null;
      return b ? { day: w.day, e1rm: Math.round(e1rm(b.weight, b.reps) * 10) / 10, weight: b.weight, reps: b.reps, volume: ex!.sets.reduce((a, st) => a + st.weight * st.reps, 0) } : null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

export function weeklyVolume(s: Pick<AppState, "workouts">, weeks = 8) {
  const out: { week: string; volume: number; workouts: number; sets: number }[] = [];
  const today = todayKey();
  for (let i = weeks - 1; i >= 0; i--) {
    const end = shiftKey(today, -7 * i);
    const start = shiftKey(end, -6);
    const ws = s.workouts.filter((w) => w.day >= start && w.day <= end);
    out.push({ week: start.slice(5), volume: ws.reduce((a, w) => a + workoutVolume(w), 0), workouts: ws.length, sets: ws.reduce((a, w) => a + workoutSets(w), 0) });
  }
  return out;
}

export function challengeStatus(s: AppState, day: string): { challenge: Challenge; progress: number; done: boolean } {
  const planned = routinesForDay(s, day).length > 0;
  const stored = s.challengesDone[day];
  const challenge = stored ?? challengeForDay(day, planned);
  if (stored) return { challenge, progress: challenge.target, done: true };
  const n = dayNutrition(s, day);
  const workouts = workoutsOnDay(s, day);
  let progress = 0;
  switch (challenge.type) {
    case "protein_plus": progress = Math.max(0, n.protein - s.goals.protein); break;
    case "all_meals": progress = new Set(n.entries.map((e) => e.meal)).size; break;
    case "water_plus": progress = s.water[day] ?? 0; break;
    case "sets": progress = workouts.reduce((a, w) => a + workoutSets(w), 0) + (s.activeWorkout?.day === day ? workoutSets(s.activeWorkout) : 0); break;
    case "volume": progress = workouts.reduce((a, w) => a + workoutVolume(w), 0) + (s.activeWorkout?.day === day ? workoutVolume(s.activeWorkout) : 0); break;
    case "weigh": {
      const w = s.weights.find((x) => x.day === day);
      progress = w && new Date(w.at).getHours() < challenge.target ? challenge.target : 0; break;
    }
    case "workout_early": {
      const early = [...workouts, ...(s.activeWorkout?.day === day ? [s.activeWorkout] : [])].some((w) => new Date(w.startedAt).getHours() < challenge.target);
      progress = early ? challenge.target : 0; break;
    }
    case "kcal_exact": {
      const diff = Math.abs(n.kcal - s.goals.kcal);
      progress = n.kcal > 0 && diff <= challenge.target ? challenge.target : 0; break;
    }
  }
  return { challenge, progress, done: progress >= challenge.target };
}

/** Activiteit per dag voor de heatmap: xp van die dag */
export function activityHeatmap(s: AppState, days = 365) {
  return lastNDays(days).map((day) => ({ day, value: xpOnDay(s, day), perfect: !!s.perfectDays[day] }));
}

export const workoutSummary = (w: Workout) => ({ volume: workoutVolume(w), sets: workoutSets(w), exercises: w.exercises.length });
