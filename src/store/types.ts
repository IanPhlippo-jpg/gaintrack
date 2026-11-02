export type MealType = "ontbijt" | "lunch" | "diner" | "snack";
export const MEAL_TYPES: { id: MealType; label: string; emoji: string }[] = [
  { id: "ontbijt", label: "Ontbijt", emoji: "🍳" },
  { id: "lunch", label: "Lunch", emoji: "🥗" },
  { id: "diner", label: "Diner", emoji: "🍽️" },
  { id: "snack", label: "Snacks", emoji: "🍎" },
];

/** Voedingsmiddel, waarden per 100 g (of per 100 ml) */
export interface Food {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** standaard portie in gram */
  portion: number;
  portionLabel?: string;
  custom?: boolean;
  /** EAN/UPC-code, als het product gescand werd */
  barcode?: string;
}

export interface FoodEntry {
  id: string;
  day: string;
  meal: MealType;
  foodId: string;
  name: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  at: number;
}

export interface Exercise {
  id: string;
  name: string;
  /** spiergroep (sleutel uit MUSCLES) */
  muscle: string;
  equipment: string;
  /** id in free-exercise-db voor de foto's */
  dbId?: string;
  custom?: boolean;
  /** eigen foto (data-url) als er geen dbId is */
  photo?: string;
}

export interface RoutineExercise {
  exerciseId: string;
  sets: number;
  reps: number;
  restSec: number;
}

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  exercises: RoutineExercise[];
  /** weekdagen 0 = zondag ... 6 = zaterdag */
  days: number[];
}

export interface SetLog {
  id: string;
  weight: number;
  reps: number;
  done: boolean;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetLog[];
}

export interface Workout {
  id: string;
  day: string;
  routineId?: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  exercises: WorkoutExercise[];
  prs?: string[];
}

export interface WeightEntry {
  day: string;
  kg: number;
  at: number;
}

export interface Goals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  targetWeight: number;
  weeklyWorkouts: number;
}

export type Activity = "zittend" | "licht" | "matig" | "actief" | "zeer";

export interface Profile {
  name: string;
  gender: "man" | "vrouw" | "anders";
  age: number;
  heightCm: number;
  startWeight: number;
  goalType: "cut" | "bulk" | "maintain";
  activity: Activity;
  experience: "beginner" | "gevorderd" | "ervaren";
  daysPerWeek: number;
  programId?: string;
}

export interface XpEvent {
  id: string;
  day: string;
  amount: number;
  reason: string;
  at: number;
}

export type ChallengeType =
  | "protein_plus"
  | "all_meals"
  | "water_plus"
  | "sets"
  | "volume"
  | "weigh"
  | "workout_early"
  | "kcal_exact";

export interface Challenge {
  day: string;
  type: ChallengeType;
  title: string;
  desc: string;
  target: number;
  xp: number;
}
