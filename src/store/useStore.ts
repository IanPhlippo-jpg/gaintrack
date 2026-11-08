import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { accountStorage } from "@/store/storage";
import { hasPerk } from "@/lib/unlocks";
import { totalXp } from "@/lib/stats";
import type {
  Challenge, Exercise, Food, FoodEntry, Goals, MealType, Profile, Routine, SetLog, Settings, WeightEntry, Workout, XpEvent,
  Cosmetics,
} from "./types";
import { SEED_ROUTINES } from "@/data/exercises";
import { todayKey, weekdayOf } from "@/lib/date";
import { uid, round } from "@/lib/utils";
import { bestSet, e1rm } from "@/lib/calc";
import { XP } from "@/lib/gamification";
import { coinsEarned, growthFactor, isConsumable, petNow, shopItem, type Pet, type PetSlot } from "@/lib/shop";

export interface AppState {
  onboarded: boolean;
  profile: Profile;
  goals: Goals;
  settings: Settings;
  customFoods: Food[];
  favoriteFoodIds: string[];
  foodLog: FoodEntry[];
  water: Record<string, number>;
  customExercises: Exercise[];
  routines: Routine[];
  workouts: Workout[];
  activeWorkout: Workout | null;
  weights: WeightEntry[];
  xpEvents: XpEvent[];
  achievements: Record<string, string>;
  perfectDays: Record<string, true>;
  challengesDone: Record<string, Challenge>;
  /** laatst getoonde feestmoment (voor toasts) */
  lastCelebration: { id: string; title: string; subtitle?: string; xp?: number; at: number } | null;
  cosmetics: Cosmetics;
  /** Weekbonus (perk) al uitgekeerd per weekstart */
  weekBonuses: Record<string, true>;
  /** coins uitgegeven in de winkel (verdiend = afgeleid uit XP, zie lib/shop.ts) */
  coinsSpent: number;
  /** gekochte permanente items (accessoires, stijl, profiel) */
  purchases: string[];
  pet: Pet | null;

  // profiel en doelen
  completeOnboarding: (profile: Profile, goals: Goals, weightKg: number, routines?: Routine[]) => void;
  /** Vervangt alle schema's door die van een programma */
  applyProgram: (programId: string, routines: Routine[], replace: boolean) => void;
  setProfile: (p: Partial<Profile>) => void;
  setGoals: (g: Partial<Goals>) => void;
  setSettings: (s: Partial<Settings>) => void;

  // voeding
  addCustomFood: (food: Omit<Food, "id" | "custom">) => Food;
  updateCustomFood: (id: string, patch: Partial<Omit<Food, "id" | "custom">>) => void;
  removeCustomFood: (id: string) => void;
  toggleFavorite: (foodId: string) => void;
  logFood: (day: string, meal: MealType, food: Food, grams: number) => void;
  updateFoodEntry: (id: string, grams: number) => void;
  removeFoodEntry: (id: string) => void;
  addWater: (day: string, ml: number) => void;

  // training
  addCustomExercise: (ex: Omit<Exercise, "id" | "custom">) => Exercise;
  updateExercise: (id: string, patch: Partial<Exercise>) => void;
  saveRoutine: (routine: Routine) => void;
  removeRoutine: (id: string) => void;
  startWorkout: (routine?: Routine) => void;
  addExerciseToWorkout: (exerciseId: string, sets?: number, reps?: number) => void;
  removeExerciseFromWorkout: (index: number) => void;
  updateSet: (exIndex: number, setIndex: number, patch: Partial<SetLog>) => void;
  addSet: (exIndex: number) => void;
  removeSet: (exIndex: number, setIndex: number) => void;
  finishWorkout: () => Workout | null;
  cancelWorkout: () => void;
  deleteWorkout: (id: string) => void;

  // gewicht
  logWeight: (day: string, kg: number) => void;
  removeWeight: (day: string) => void;

  // gamification
  awardXp: (amount: number, reason: string, day?: string) => void;
  unlockAchievement: (id: string, title: string) => void;
  markPerfectDay: (day: string, streak: number) => void;
  markChallengeDone: (challenge: Challenge) => void;
  celebrate: (c: { title: string; subtitle?: string; xp?: number }) => void;
  setCosmetics: (patch: Partial<Cosmetics>) => void;
  markWeekBonus: (weekStart: string, xp: number) => void;

  // winkel en diertje
  adoptPet: (name: string) => void;
  renamePet: (name: string) => void;
  /** koopt een item; eten en verzorging gaan meteen naar het diertje. Geeft false bij te weinig coins. */
  buy: (itemId: string) => boolean;
  equipPet: (slot: PetSlot, itemId: string | undefined) => void;
  setPetStyle: (patch: { color?: string; background?: string }) => void;
  clearCelebration: () => void;
  resetAll: () => void;
}

const DEFAULT_PROFILE: Profile = { name: "", gender: "man", age: 30, heightCm: 180, startWeight: 80, goalType: "maintain", activity: "matig", experience: "beginner", daysPerWeek: 3 };
const DEFAULT_GOALS: Goals = { kcal: 2500, protein: 160, carbs: 280, fat: 80, waterMl: 2500, targetWeight: 80, weeklyWorkouts: 4 };
const DEFAULT_SETTINGS: Settings = { restEnabled: true, restSec: 90, restForAll: false, haptics: true, pushEnabled: false };

const emptySet = (weight = 0, reps = 0): SetLog => ({ id: uid(), weight, reps, done: false });

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      profile: DEFAULT_PROFILE,
      goals: DEFAULT_GOALS,
      settings: DEFAULT_SETTINGS,
      customFoods: [],
      favoriteFoodIds: [],
      foodLog: [],
      water: {},
      customExercises: [],
      routines: SEED_ROUTINES,
      workouts: [],
      activeWorkout: null,
      weights: [],
      xpEvents: [],
      achievements: {},
      perfectDays: {},
      challengesDone: {},
      lastCelebration: null,
      cosmetics: {},
      weekBonuses: {},
      coinsSpent: 0,
      purchases: [],
      pet: null,

      adoptPet: (name) => {
        const now = Date.now();
        set({ pet: { name: name.trim().slice(0, 16) || "Gainy", color: "lila", growth: 0, food: 70, clean: 80, fun: 70, updatedAt: now, createdAt: now, equipped: {} } });
      },
      renamePet: (name) => set((s) => (s.pet ? { pet: { ...s.pet, name: name.trim().slice(0, 16) || s.pet.name } } : {})),
      buy: (itemId) => {
        const s = get();
        const item = shopItem(itemId);
        if (!item) return false;
        const balance = coinsEarned(totalXp(s)) - s.coinsSpent;
        if (balance < item.price) return false;
        if (isConsumable(item)) {
          if (!s.pet) return false;
          const p = petNow(s.pet);
          const e = item.effect ?? {};
          const c = (v: number) => Math.max(0, Math.min(100, v));
          const pet: Pet = { ...p, food: c(p.food + (e.food ?? 0)), clean: c(p.clean + (e.clean ?? 0)), fun: c(p.fun + (e.fun ?? 0)), growth: p.growth + Math.round((e.growth ?? 0) * growthFactor(p)) };
          set({ pet, coinsSpent: s.coinsSpent + item.price });
          return true;
        }
        if (s.purchases.includes(itemId)) return false;
        set({ purchases: [...s.purchases, itemId], coinsSpent: s.coinsSpent + item.price });
        return true;
      },
      equipPet: (slot, itemId) =>
        set((s) => {
          if (!s.pet || (itemId && !s.purchases.includes(itemId))) return {};
          return { pet: { ...s.pet, equipped: { ...s.pet.equipped, [slot]: itemId } } };
        }),
      setPetStyle: (patch) => set((s) => (s.pet ? { pet: { ...s.pet, ...patch } } : {})),

      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      completeOnboarding: (profile, goals, weightKg, routines) => {
        // Het startgewicht wordt bewust niet als meting van vandaag geregistreerd:
        // de gebruiker bevestigt zijn weging zelf op het gewichtsscherm.
        set((s) => ({
          onboarded: true,
          profile: { ...profile, startWeight: round(weightKg, 1) },
          goals,
          routines: routines ?? s.routines,
        }));
      },
      applyProgram: (programId, routines, replace) =>
        set((s) => ({
          profile: { ...s.profile, programId },
          routines: replace ? routines : [...s.routines.filter((r) => !routines.some((n) => n.id === r.id)), ...routines],
        })),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setGoals: (g) => set((s) => ({ goals: { ...s.goals, ...g } })),

      addCustomFood: (food) => {
        const f: Food = { ...food, id: "c-" + uid(), custom: true };
        set((s) => ({ customFoods: [f, ...s.customFoods] }));
        return f;
      },
      updateCustomFood: (id, patch) => set((s) => ({ customFoods: s.customFoods.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),
      removeCustomFood: (id) => set((s) => ({ customFoods: s.customFoods.filter((f) => f.id !== id) })),
      toggleFavorite: (foodId) =>
        set((s) => ({
          favoriteFoodIds: s.favoriteFoodIds.includes(foodId)
            ? s.favoriteFoodIds.filter((x) => x !== foodId)
            : [...s.favoriteFoodIds, foodId],
        })),
      logFood: (day, meal, food, grams) => {
        const k = grams / 100;
        const entry: FoodEntry = {
          id: uid(), day, meal, foodId: food.id, name: food.name, grams,
          kcal: round(food.kcal * k), protein: round(food.protein * k, 1), carbs: round(food.carbs * k, 1), fat: round(food.fat * k, 1), at: Date.now(),
        };
        set((s) => ({ foodLog: [...s.foodLog, entry] }));
        // Hooguit 6 maaltijd-registraties per dag leveren XP op.
        if (get().foodLog.filter((e) => e.day === day).length <= 6) get().awardXp(XP.meal, `Maaltijd gelogd: ${food.name}`, day);
      },
      updateFoodEntry: (id, grams) =>
        set((s) => ({
          foodLog: s.foodLog.map((e) => {
            if (e.id !== id) return e;
            const k = grams / e.grams;
            return { ...e, grams, kcal: round(e.kcal * k), protein: round(e.protein * k, 1), carbs: round(e.carbs * k, 1), fat: round(e.fat * k, 1) };
          }),
        })),
      removeFoodEntry: (id) => set((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) })),
      addWater: (day, ml) => {
        const before = get().water[day] ?? 0;
        set((s) => ({ water: { ...s.water, [day]: Math.max(0, (s.water[day] ?? 0) + ml) } }));
        // XP enkel zolang je onder je dagdoel zit: eindeloos water tikken levert niets op.
        if (ml > 0 && before < get().goals.waterMl) get().awardXp(XP.water, "Water gedronken", day);
        return;

      },

      addCustomExercise: (ex) => {
        const e: Exercise = { ...ex, id: "c-" + uid(), custom: true };
        set((s) => ({ customExercises: [e, ...s.customExercises] }));
        return e;
      },
      updateExercise: (id, patch) =>
        set((s) => ({ customExercises: s.customExercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
      saveRoutine: (routine) =>
        set((s) => ({
          routines: s.routines.some((r) => r.id === routine.id)
            ? s.routines.map((r) => (r.id === routine.id ? routine : r))
            : [...s.routines, routine],
        })),
      removeRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      startWorkout: (routine) => {
        const s = get();
        const lastFor = (exerciseId: string) => {
          for (let i = s.workouts.length - 1; i >= 0; i--) {
            const ex = s.workouts[i].exercises.find((x) => x.exerciseId === exerciseId);
            if (ex && ex.sets.some((st) => st.done)) return ex.sets.filter((st) => st.done);
          }
          return null;
        };
        const workout: Workout = {
          id: uid(),
          day: todayKey(),
          routineId: routine?.id,
          name: routine?.name ?? "Vrije training",
          startedAt: Date.now(),
          exercises: (routine?.exercises ?? []).map((rx) => {
            const prev = lastFor(rx.exerciseId);
            return {
              exerciseId: rx.exerciseId,
              sets: Array.from({ length: rx.sets }, (_, i) => emptySet(prev?.[i]?.weight ?? prev?.[prev.length - 1]?.weight ?? 0, prev?.[i]?.reps ?? rx.reps)),
            };
          }),
        };
        set({ activeWorkout: workout });
      },
      addExerciseToWorkout: (exerciseId, sets = 3, reps = 10) =>
        set((s) => {
          if (!s.activeWorkout) return {};
          let prev: SetLog[] | null = null;
          for (let i = s.workouts.length - 1; i >= 0 && !prev; i--) {
            const ex = s.workouts[i].exercises.find((x) => x.exerciseId === exerciseId);
            if (ex && ex.sets.some((st) => st.done)) prev = ex.sets.filter((st) => st.done);
          }
          return {
            activeWorkout: {
              ...s.activeWorkout,
              exercises: [
                ...s.activeWorkout.exercises,
                { exerciseId, sets: Array.from({ length: sets }, (_, i) => emptySet(prev?.[i]?.weight ?? 0, prev?.[i]?.reps ?? reps)) },
              ],
            },
          };
        }),
      removeExerciseFromWorkout: (index) =>
        set((s) =>
          s.activeWorkout
            ? { activeWorkout: { ...s.activeWorkout, exercises: s.activeWorkout.exercises.filter((_, i) => i !== index) } }
            : {},
        ),
      updateSet: (exIndex, setIndex, patch) =>
        set((s) => {
          if (!s.activeWorkout) return {};
          const exercises = s.activeWorkout.exercises.map((ex, i) =>
            i !== exIndex ? ex : { ...ex, sets: ex.sets.map((st, j) => (j !== setIndex ? st : { ...st, ...patch })) },
          );
          return { activeWorkout: { ...s.activeWorkout, exercises } };
        }),
      addSet: (exIndex) =>
        set((s) => {
          if (!s.activeWorkout) return {};
          const exercises = s.activeWorkout.exercises.map((ex, i) => {
            if (i !== exIndex) return ex;
            const last = ex.sets[ex.sets.length - 1];
            return { ...ex, sets: [...ex.sets, emptySet(last?.weight ?? 0, last?.reps ?? 10)] };
          });
          return { activeWorkout: { ...s.activeWorkout, exercises } };
        }),
      removeSet: (exIndex, setIndex) =>
        set((s) => {
          if (!s.activeWorkout) return {};
          const exercises = s.activeWorkout.exercises.map((ex, i) =>
            i !== exIndex ? ex : { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) },
          );
          return { activeWorkout: { ...s.activeWorkout, exercises } };
        }),
      finishWorkout: () => {
        const s = get();
        const w = s.activeWorkout;
        if (!w) return null;
        const done: Workout = {
          ...w,
          endedAt: Date.now(),
          exercises: w.exercises
            .map((ex) => ({ ...ex, sets: ex.sets.filter((st) => st.done && st.reps > 0) }))
            .filter((ex) => ex.sets.length > 0),
        };
        if (done.exercises.length === 0) {
          set({ activeWorkout: null });
          return null;
        }
        // PR-detectie: beste e1RM per oefening tegenover alle vorige trainingen
        const prs: string[] = [];
        for (const ex of done.exercises) {
          const best = bestSet(ex.sets);
          if (!best) continue;
          let prevBest = 0;
          for (const old of s.workouts) {
            const oe = old.exercises.find((x) => x.exerciseId === ex.exerciseId);
            if (!oe) continue;
            const ob = bestSet(oe.sets);
            if (ob) prevBest = Math.max(prevBest, e1rm(ob.weight, ob.reps));
          }
          if (prevBest > 0 && e1rm(best.weight, best.reps) > prevBest + 0.01) prs.push(ex.exerciseId);
        }
        done.prs = prs;
        const sets = done.exercises.reduce((n, ex) => n + ex.sets.length, 0);
        // Je diertje traint mee: een afgewerkte training maakt het blij.
        set((st) => ({ workouts: [...st.workouts, done], activeWorkout: null, pet: st.pet ? (() => { const p = petNow(st.pet); return { ...p, fun: Math.min(100, p.fun + 25) }; })() : null }));
        get().awardXp(XP.workout + sets * XP.set, `Training afgewerkt: ${done.name}`, done.day);
        if (prs.length) get().awardXp(prs.length * XP.pr, `${prs.length} nieuw${prs.length > 1 ? "e" : ""} PR${prs.length > 1 ? "'s" : ""}`, done.day);
        return done;
      },
      cancelWorkout: () => set({ activeWorkout: null }),
      deleteWorkout: (id) => set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      logWeight: (day, kg) => {
        const existed = get().weights.some((w) => w.day === day);
        set((s) => ({
          weights: [...s.weights.filter((w) => w.day !== day), { day, kg: round(kg, 1), at: Date.now() }].sort((a, b) => a.day.localeCompare(b.day)),
        }));
        if (!existed) get().awardXp(XP.weight, "Gewicht ingegeven", day);
      },
      removeWeight: (day) => set((s) => ({ weights: s.weights.filter((w) => w.day !== day) })),

      awardXp: (amount, reason, day = todayKey()) =>
        set((s) => {
          // Voordeel "Dubbele XP in het weekend" (level 8+): zaterdag en zondag tellen dubbel.
          const weekend = weekdayOf(day) === 0 || weekdayOf(day) === 6;
          const doubled = weekend && amount > 0 && hasPerk(totalXp(s), "perk-weekend-xp");
          return { xpEvents: [...s.xpEvents, { id: uid(), day, amount: doubled ? amount * 2 : amount, reason: doubled ? `${reason} (x2 weekend)` : reason, at: Date.now() }] };
        }),
      unlockAchievement: (id, title) => {
        if (get().achievements[id]) return;
        set((s) => ({
          achievements: { ...s.achievements, [id]: todayKey() },
          lastCelebration: { id: uid(), title: "Badge ontgrendeld", subtitle: title, at: Date.now() },
        }));
      },
      markPerfectDay: (day, streak) => {
        if (get().perfectDays[day]) return;
        const bonus = XP.perfectDay + Math.min(10, streak) * XP.streakBonusPerDay;
        set((s) => ({ perfectDays: { ...s.perfectDays, [day]: true } }));
        get().awardXp(bonus, `Perfecte dag (streak ${streak})`, day);
        get().celebrate({ title: "Perfecte dag!", subtitle: streak > 1 ? `${streak} dagen op rij` : "Alle dagdoelen gehaald", xp: bonus });
      },
      markChallengeDone: (challenge) => {
        if (get().challengesDone[challenge.day]) return;
        set((s) => ({ challengesDone: { ...s.challengesDone, [challenge.day]: challenge } }));
        get().awardXp(challenge.xp, `Uitdaging: ${challenge.title}`, challenge.day);
        get().celebrate({ title: "Uitdaging gehaald!", subtitle: challenge.title, xp: challenge.xp });
      },
      celebrate: (c) => set({ lastCelebration: { id: uid(), at: Date.now(), ...c } }),
      setCosmetics: (patch) => set((s) => ({ cosmetics: { ...s.cosmetics, ...patch } })),
      markWeekBonus: (weekStart, xp) => {
        if (get().weekBonuses[weekStart]) return;
        set((s) => ({ weekBonuses: { ...s.weekBonuses, [weekStart]: true } }));
        get().awardXp(xp, "Weekbonus: 5 perfecte dagen in een week");
        set({ lastCelebration: { id: uid(), title: "Weekbonus!", subtitle: `+${xp} XP voor 5 perfecte dagen deze week`, xp, at: Date.now() } });
      },
      clearCelebration: () => set({ lastCelebration: null }),
      resetAll: () =>
        set({
          onboarded: false, profile: DEFAULT_PROFILE, goals: DEFAULT_GOALS, settings: DEFAULT_SETTINGS, customFoods: [], favoriteFoodIds: [], foodLog: [], water: {},
          customExercises: [], routines: SEED_ROUTINES, workouts: [], activeWorkout: null, weights: [], xpEvents: [], achievements: {},
          perfectDays: {}, challengesDone: {}, lastCelebration: null, cosmetics: {}, weekBonuses: {}, coinsSpent: 0, purchases: [], pet: null,
        }),
    }),
    {
      name: "gaintrack-v1",
      storage: createJSONStorage(() => accountStorage),
      // Pas laden nadat het account op dit toestel bekend is (zie AccountGate).
      skipHydration: true,
      partialize: (s) => ({ ...s, lastCelebration: null }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return { ...current, ...p, settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) }, profile: { ...DEFAULT_PROFILE, ...(p.profile ?? {}) }, cosmetics: p.cosmetics ?? {}, weekBonuses: p.weekBonuses ?? {}, coinsSpent: p.coinsSpent ?? 0, purchases: p.purchases ?? [], pet: p.pet ?? null };
      },
    },
  ),
);

export type WeightEntryT = WeightEntry;
