import type { SetLog, Workout } from "@/store/types";

/** Geschatte 1RM volgens Epley */
export const e1rm = (weight: number, reps: number) => (reps <= 1 ? weight : weight * (1 + reps / 30));

export const setVolume = (s: SetLog) => (s.done ? s.weight * s.reps : 0);

export const workoutVolume = (w: Workout) =>
  w.exercises.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + setVolume(set), 0), 0);

export const workoutSets = (w: Workout) =>
  w.exercises.reduce((sum, ex) => sum + ex.sets.filter((s) => s.done).length, 0);

export const bestSet = (sets: SetLog[]) => {
  let best: SetLog | null = null;
  for (const s of sets) {
    if (!s.done || s.reps <= 0) continue;
    if (!best || e1rm(s.weight, s.reps) > e1rm(best.weight, best.reps)) best = s;
  }
  return best;
};

export const durationMin = (w: Workout) => Math.max(1, Math.round(((w.endedAt ?? Date.now()) - w.startedAt) / 60000));

/** Voortschrijdend gemiddelde over n punten */
export function movingAverage(values: number[], n = 7): (number | null)[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - n + 1), i + 1);
    return slice.length ? slice.reduce((a, b) => a + b, 0) / slice.length : null;
  });
}

/** Lineaire trend (kg per week) over een reeks (dag, kg) */
export function weeklyTrend(points: { x: number; y: number }[]): number | null {
  if (points.length < 2) return null;
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  const num = points.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0);
  const den = points.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  if (den === 0) return null;
  return (num / den) * 7;
}

const ACTIVITY_FACTOR: Record<string, number> = { zittend: 1.2, licht: 1.375, matig: 1.55, actief: 1.725, zeer: 1.9 };

/**
 * Dagdoelen op basis van de quizantwoorden.
 * Energie: Mifflin-St Jeor × activiteitsfactor, daarna -400 (afvallen) of +300 (aankomen).
 * Eiwit 2 g/kg (2,2 bij afvallen), vet 27 % van de energie, koolhydraten de rest. Water 35 ml/kg.
 */
export function computeGoals(p: { gender: "man" | "vrouw" | "anders"; age: number; heightCm: number; activity: string; goalType: "cut" | "bulk" | "maintain" }, weightKg: number) {
  const base = 10 * weightKg + 6.25 * p.heightCm - 5 * p.age;
  const bmr = p.gender === "vrouw" ? base - 161 : p.gender === "man" ? base + 5 : base - 78;
  const tdee = bmr * (ACTIVITY_FACTOR[p.activity] ?? 1.55);
  const kcal = Math.round((p.goalType === "cut" ? tdee - 400 : p.goalType === "bulk" ? tdee + 300 : tdee) / 10) * 10;
  const protein = Math.round(weightKg * (p.goalType === "cut" ? 2.2 : 2));
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(50, Math.round((kcal - protein * 4 - fat * 9) / 4));
  const waterMl = Math.round((weightKg * 35) / 250) * 250;
  const targetWeight = Math.round((p.goalType === "cut" ? weightKg - 5 : p.goalType === "bulk" ? weightKg + 4 : weightKg) * 2) / 2;
  return { kcal, protein, carbs, fat, waterMl, targetWeight };
}
