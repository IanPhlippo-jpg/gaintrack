import type { Exercise, Routine } from "@/store/types";
import db from "./exercise-db.json";

export interface DbExercise {
  id: string;
  n: string;
  m: string;
  s: string[];
  q: string;
  l: string;
  c: string;
  img: number;
}

export const EXERCISE_DB = db as DbExercise[];

export const MUSCLES: Record<string, string> = {
  abdominals: "Buik",
  hamstrings: "Hamstrings",
  adductors: "Adductoren",
  abductors: "Abductoren",
  quadriceps: "Quadriceps",
  biceps: "Biceps",
  shoulders: "Schouders",
  chest: "Borst",
  "middle back": "Midden rug",
  "lower back": "Onderrug",
  lats: "Lats",
  calves: "Kuiten",
  glutes: "Bilspieren",
  triceps: "Triceps",
  traps: "Trapezius",
  forearms: "Onderarmen",
  neck: "Nek",
  cardio: "Cardio",
  other: "Overig",
};

export const EQUIPMENT: Record<string, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  cable: "Kabel",
  machine: "Machine",
  "body only": "Lichaamsgewicht",
  kettlebells: "Kettlebell",
  bands: "Weerstandsband",
  "e-z curl bar": "EZ-bar",
  "medicine ball": "Medicijnbal",
  "exercise ball": "Fitnessbal",
  "foam roll": "Foamroller",
  other: "Overig",
};

export const MUSCLE_GROUPS: { id: string; label: string; muscles: string[] }[] = [
  { id: "chest", label: "Borst", muscles: ["chest"] },
  { id: "back", label: "Rug", muscles: ["lats", "middle back", "lower back", "traps"] },
  { id: "shoulders", label: "Schouders", muscles: ["shoulders", "neck"] },
  { id: "arms", label: "Armen", muscles: ["biceps", "triceps", "forearms"] },
  { id: "legs", label: "Benen", muscles: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"] },
  { id: "core", label: "Core", muscles: ["abdominals"] },
];

/** Foto van iemand die de oefening uitvoert (startpositie = 0, eindpositie = 1) */
export const exerciseImage = (dbId: string, frame: 0 | 1 = 0) =>
  `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${dbId}/${frame}.jpg`;

const e = (id: string, name: string, muscle: string, equipment: string, dbId: string): Exercise => ({
  id, name, muscle, equipment, dbId,
});

/** Nederlandstalige basisoefeningen met foto uit de database */
export const SEED_EXERCISES: Exercise[] = [
  // Borst
  e("bench-press", "Bankdrukken (barbell)", "chest", "barbell", "Barbell_Bench_Press_-_Medium_Grip"),
  e("incline-bench", "Schuin bankdrukken (barbell)", "chest", "barbell", "Barbell_Incline_Bench_Press_-_Medium_Grip"),
  e("db-bench", "Bankdrukken (dumbbells)", "chest", "dumbbell", "Dumbbell_Bench_Press"),
  e("incline-db", "Schuin bankdrukken (dumbbells)", "chest", "dumbbell", "Incline_Dumbbell_Press"),
  e("chest-press", "Chest press (machine)", "chest", "machine", "Leverage_Chest_Press"),
  e("db-fly", "Dumbbell flyes", "chest", "dumbbell", "Dumbbell_Flyes"),
  e("cable-cross", "Cable crossover", "chest", "cable", "Cable_Crossover"),
  e("pec-deck", "Pec deck (butterfly)", "chest", "machine", "Butterfly"),
  e("dips", "Dips", "triceps", "body only", "Dips_-_Triceps_Version"),
  e("pushups", "Push-ups", "chest", "body only", "Pushups"),
  // Rug
  e("deadlift", "Deadlift", "lower back", "barbell", "Barbell_Deadlift"),
  e("sumo-deadlift", "Sumo deadlift", "hamstrings", "barbell", "Sumo_Deadlift"),
  e("pullups", "Pull-ups", "lats", "body only", "Pullups"),
  e("chinups", "Chin-ups", "lats", "body only", "Chin-Up"),
  e("lat-pulldown", "Lat pulldown", "lats", "cable", "Wide-Grip_Lat_Pulldown"),
  e("close-pulldown", "Lat pulldown (smalle greep)", "lats", "cable", "Close-Grip_Front_Lat_Pulldown"),
  e("bb-row", "Barbell row", "middle back", "barbell", "Bent_Over_Barbell_Row"),
  e("db-row", "Dumbbell row (één arm)", "middle back", "dumbbell", "One-Arm_Dumbbell_Row"),
  e("cable-row", "Seated cable row", "middle back", "cable", "Seated_Cable_Rows"),
  e("tbar-row", "T-bar row", "middle back", "machine", "Lying_T-Bar_Row"),
  e("face-pull", "Face pull", "shoulders", "cable", "Face_Pull"),
  e("back-ext", "Back extensions", "lower back", "other", "Hyperextensions_Back_Extensions"),
  e("shrug", "Shrugs (barbell)", "traps", "barbell", "Barbell_Shrug"),
  // Schouders
  e("ohp", "Overhead press (barbell)", "shoulders", "barbell", "Barbell_Shoulder_Press"),
  e("db-shoulder-press", "Shoulder press (dumbbells)", "shoulders", "dumbbell", "Dumbbell_Shoulder_Press"),
  e("arnold-press", "Arnold press", "shoulders", "dumbbell", "Arnold_Dumbbell_Press"),
  e("lateral-raise", "Lateral raises", "shoulders", "dumbbell", "Side_Lateral_Raise"),
  e("reverse-fly", "Reverse flyes", "shoulders", "dumbbell", "Reverse_Flyes"),
  e("upright-row", "Upright row", "traps", "barbell", "Upright_Barbell_Row"),
  // Armen
  e("bb-curl", "Barbell curl", "biceps", "barbell", "Barbell_Curl"),
  e("db-curl", "Dumbbell curl", "biceps", "dumbbell", "Dumbbell_Bicep_Curl"),
  e("hammer-curl", "Hammer curl", "biceps", "dumbbell", "Hammer_Curls"),
  e("preacher-curl", "Preacher curl", "biceps", "barbell", "Preacher_Curl"),
  e("concentration-curl", "Concentration curl", "biceps", "dumbbell", "Concentration_Curls"),
  e("triceps-pushdown", "Triceps pushdown", "triceps", "cable", "Triceps_Pushdown"),
  e("skullcrusher", "Skullcrushers", "triceps", "e-z curl bar", "EZ-Bar_Skullcrusher"),
  e("overhead-triceps", "Overhead triceps extension (touw)", "triceps", "cable", "Cable_Rope_Overhead_Triceps_Extension"),
  e("kickback", "Triceps kickback", "triceps", "dumbbell", "Tricep_Dumbbell_Kickback"),
  e("bench-dips", "Bench dips", "triceps", "body only", "Bench_Dips"),
  // Benen
  e("squat", "Squat (barbell)", "quadriceps", "barbell", "Barbell_Squat"),
  e("front-squat", "Front squat", "quadriceps", "barbell", "Front_Squat_Clean_Grip"),
  e("goblet-squat", "Goblet squat", "quadriceps", "kettlebells", "Goblet_Squat"),
  e("hack-squat", "Hack squat", "quadriceps", "machine", "Hack_Squat"),
  e("leg-press", "Leg press", "quadriceps", "machine", "Leg_Press"),
  e("rdl", "Romanian deadlift", "hamstrings", "barbell", "Romanian_Deadlift"),
  e("leg-curl", "Leg curl (liggend)", "hamstrings", "machine", "Lying_Leg_Curls"),
  e("seated-leg-curl", "Leg curl (zittend)", "hamstrings", "machine", "Seated_Leg_Curl"),
  e("leg-ext", "Leg extension", "quadriceps", "machine", "Leg_Extensions"),
  e("lunges", "Lunges (dumbbells)", "quadriceps", "dumbbell", "Dumbbell_Lunges"),
  e("walking-lunge", "Walking lunges (barbell)", "quadriceps", "barbell", "Barbell_Walking_Lunge"),
  e("split-squat", "Bulgarian split squat", "quadriceps", "dumbbell", "Split_Squat_with_Dumbbells"),
  e("hip-thrust", "Hip thrust", "glutes", "barbell", "Barbell_Hip_Thrust"),
  e("glute-bridge", "Glute bridge", "glutes", "barbell", "Barbell_Glute_Bridge"),
  e("step-ups", "Step-ups", "quadriceps", "dumbbell", "Dumbbell_Step_Ups"),
  e("calf-raise", "Calf raises (staand)", "calves", "machine", "Standing_Calf_Raises"),
  e("seated-calf", "Calf raises (zittend)", "calves", "machine", "Seated_Calf_Raise"),
  // Core
  e("plank", "Plank", "abdominals", "body only", "Plank"),
  e("hanging-leg-raise", "Hanging leg raise", "abdominals", "body only", "Hanging_Leg_Raise"),
  e("cable-crunch", "Cable crunch", "abdominals", "cable", "Cable_Crunch"),
  e("ab-machine", "Ab crunch (machine)", "abdominals", "machine", "Ab_Crunch_Machine"),
  e("decline-crunch", "Decline crunch", "abdominals", "body only", "Decline_Crunch"),
  e("russian-twist", "Russian twist", "abdominals", "body only", "Russian_Twist"),
  e("mountain-climbers", "Mountain climbers", "abdominals", "body only", "Mountain_Climbers"),
  // Cardio
  e("treadmill", "Loopband", "cardio", "machine", "Running_Treadmill"),
  e("bike", "Hometrainer", "cardio", "machine", "Bicycling_Stationary"),
  e("rowing", "Roeimachine", "cardio", "machine", "Rowing_Stationary"),
  e("farmers-walk", "Farmer's walk", "forearms", "other", "Farmers_Walk"),
];

const rx = (exerciseId: string, sets: number, reps: number, restSec = 90) => ({ exerciseId, sets, reps, restSec });

/** Standaardschema: Push / Pull / Legs */
export const SEED_ROUTINES: Routine[] = [
  {
    id: "push",
    name: "Push (borst, schouders, triceps)",
    emoji: "🔥",
    days: [1, 4],
    exercises: [rx("bench-press", 4, 8, 120), rx("incline-db", 3, 10), rx("db-shoulder-press", 3, 10), rx("lateral-raise", 3, 15, 60), rx("cable-cross", 3, 12, 60), rx("triceps-pushdown", 3, 12, 60), rx("overhead-triceps", 3, 12, 60)],
  },
  {
    id: "pull",
    name: "Pull (rug, biceps)",
    emoji: "💪",
    days: [2, 5],
    exercises: [rx("deadlift", 3, 5, 180), rx("pullups", 3, 8, 120), rx("bb-row", 4, 8, 120), rx("cable-row", 3, 10), rx("face-pull", 3, 15, 60), rx("bb-curl", 3, 10, 60), rx("hammer-curl", 3, 12, 60)],
  },
  {
    id: "legs",
    name: "Legs (benen, core)",
    emoji: "🦵",
    days: [3, 6],
    exercises: [rx("squat", 4, 6, 180), rx("rdl", 3, 8, 120), rx("leg-press", 3, 12), rx("leg-curl", 3, 12, 60), rx("leg-ext", 3, 15, 60), rx("calf-raise", 4, 15, 60), rx("hanging-leg-raise", 3, 12, 60)],
  },
];

/** Extra sjablonen die je kunt toevoegen */
export const ROUTINE_TEMPLATES: Routine[] = [
  {
    id: "fullbody-a",
    name: "Full body A",
    emoji: "⚡",
    days: [1, 4],
    exercises: [rx("squat", 3, 8, 150), rx("bench-press", 3, 8, 120), rx("bb-row", 3, 8, 120), rx("ohp", 3, 10), rx("plank", 3, 60, 60)],
  },
  {
    id: "fullbody-b",
    name: "Full body B",
    emoji: "⚡",
    days: [2, 5],
    exercises: [rx("deadlift", 3, 5, 180), rx("incline-db", 3, 10), rx("lat-pulldown", 3, 10), rx("lunges", 3, 12), rx("db-curl", 3, 12, 60), rx("triceps-pushdown", 3, 12, 60)],
  },
  {
    id: "upper",
    name: "Upper body",
    emoji: "🏋️",
    days: [1, 4],
    exercises: [rx("bench-press", 4, 8, 120), rx("bb-row", 4, 8, 120), rx("ohp", 3, 10), rx("lat-pulldown", 3, 10), rx("lateral-raise", 3, 15, 60), rx("bb-curl", 3, 10, 60), rx("skullcrusher", 3, 10, 60)],
  },
  {
    id: "lower",
    name: "Lower body",
    emoji: "🦵",
    days: [2, 5],
    exercises: [rx("squat", 4, 6, 180), rx("rdl", 3, 8, 120), rx("hip-thrust", 3, 10), rx("leg-ext", 3, 15, 60), rx("leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 60), rx("cable-crunch", 3, 15, 60)],
  },
];
