import * as React from "react";
import { useStore, type AppState } from "@/store/useStore";
import { challengeStatus, currentStreak, dailyGoals, dayNutrition, longestStreak, totalXp } from "@/lib/stats";
import { ACHIEVEMENTS, levelFromXp } from "@/lib/gamification";
import { lastNDays, todayKey, weekStartKey, shiftKey } from "@/lib/date";
import { hasPerk, unlocksForLevel } from "@/lib/unlocks";
import { levelTitle } from "@/lib/gamification";
import { workoutVolume } from "@/lib/calc";

/** Voortgang (0..1) per badge, voor de ring rond vergrendelde badges */
export function achievementProgress(s: AppState): Record<string, number> {
  const xp = totalXp(s);
  const level = levelFromXp(xp);
  const streak = Math.max(currentStreak(s), longestStreak(s));
  const prs = s.workouts.reduce((a, w) => a + (w.prs?.length ?? 0), 0);
  const maxVolume = s.workouts.reduce((a, w) => Math.max(a, workoutVolume(w)), 0);
  const last7 = lastNDays(7);
  const proteinRun = last7.filter((d) => dayNutrition(s, d).protein >= s.goals.protein).length;
  const weighRun = lastNDays(14).filter((d) => s.weights.some((w) => w.day === d)).length;
  const f = (v: number, t: number) => Math.min(1, v / t);
  return {
    "first-meal": f(s.foodLog.length, 1),
    "first-workout": f(s.workouts.length, 1),
    "first-weight": f(s.weights.length, 1),
    "perfect-day": f(Object.keys(s.perfectDays).length, 1),
    "streak-3": f(streak, 3),
    "streak-7": f(streak, 7),
    "streak-30": f(streak, 30),
    "workouts-10": f(s.workouts.length, 10),
    "workouts-50": f(s.workouts.length, 50),
    "first-pr": f(prs, 1),
    "pr-10": f(prs, 10),
    "volume-10t": f(maxVolume, 10000),
    "protein-7": f(proteinRun, 7),
    "weigh-14": f(weighRun, 14),
    "level-5": f(level, 5),
    "level-10": f(level, 10),
    "challenges-10": f(Object.keys(s.challengesDone).length, 10),
    "meals-100": f(s.foodLog.length, 100),
  };
}

/**
 * Bewaakt na elke wijziging: perfecte dag, dagelijkse uitdaging en badges.
 * De store-acties zijn idempotent, dus dit mag vaak draaien.
 */
export function useGoalEngine() {
  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let prevLevel: number | null = null;
    const run = () => {
      const s = useStore.getState();
      if (!s.onboarded) return;
      const today = todayKey();

      // Nieuw level: vieren en de ontgrendelde beloning tonen.
      const level = levelFromXp(totalXp(s));
      if (prevLevel !== null && level > prevLevel) {
        const got = unlocksForLevel(level);
        s.celebrate({ title: `Level ${level}: ${levelTitle(level)}!`, subtitle: got.length ? `Ontgrendeld: ${got.map((u) => `${u.icon} ${u.name}`).join(", ")}` : "Blijf gaan, de volgende beloning komt eraan." });
      }
      prevLevel = level;

      // Weekbonus (voordeel vanaf level 12): 5 perfecte dagen in de huidige week.
      if (hasPerk(totalXp(s), "perk-week-bonus")) {
        const monday = weekStartKey(today);
        const perfect = Array.from({ length: 7 }, (_, i) => shiftKey(monday, i)).filter((d) => s.perfectDays[d]).length;
        if (perfect >= 5 && !s.weekBonuses[monday]) s.markWeekBonus(monday, 250);
      }

      // perfecte dag
      if (!s.perfectDays[today] && dailyGoals(s, today).every((g) => g.done)) {
        s.markPerfectDay(today, currentStreak(s) + 1);
      }
      // uitdaging
      const ch = challengeStatus(s, today);
      if (ch.done && !s.challengesDone[today]) s.markChallengeDone(ch.challenge);

      // badges
      const progress = achievementProgress(useStore.getState());
      for (const a of ACHIEVEMENTS) {
        if (!useStore.getState().achievements[a.id] && progress[a.id] >= 1) {
          useStore.getState().unlockAchievement(a.id, `${a.icon} ${a.name}`);
          break; // één badge per ronde, zodat de toasts niet over elkaar vallen
        }
      }
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, 150);
    };
    schedule();
    const unsub = useStore.subscribe(schedule);
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
