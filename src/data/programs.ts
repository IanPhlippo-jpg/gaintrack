import type { Routine } from "@/store/types";

export type Gender = "man" | "vrouw" | "anders";
export type Level = "beginner" | "gevorderd" | "ervaren";

export interface Program {
  id: string;
  name: string;
  gender: "man" | "vrouw" | "iedereen";
  level: Level;
  days: number;
  focus: string;
  desc: string;
  routines: Routine[];
}

const rx = (exerciseId: string, sets: number, reps: number, restSec = 90) => ({ exerciseId, sets, reps, restSec });
const r = (id: string, name: string, emoji: string, days: number[], exercises: ReturnType<typeof rx>[]): Routine => ({ id, name, emoji, days, exercises });

/* ---------------- Mannen ---------------- */

const MEN: Program[] = [
  {
    id: "m-fb2",
    name: "Full body starter",
    gender: "man",
    level: "beginner",
    days: 2,
    focus: "Hele lichaam",
    desc: "Twee korte, complete trainingen per week. Ideaal om de basisbewegingen te leren.",
    routines: [
      r("m-fb2-a", "Full body A", "⚡", [1], [rx("goblet-squat", 3, 10, 90), rx("db-bench", 3, 10, 90), rx("db-row", 3, 10, 90), rx("db-shoulder-press", 2, 12, 60), rx("plank", 3, 40, 60)]),
      r("m-fb2-b", "Full body B", "⚡", [4], [rx("leg-press", 3, 12, 90), rx("lat-pulldown", 3, 10, 90), rx("incline-db", 3, 10, 90), rx("rdl", 3, 10, 90), rx("hanging-leg-raise", 3, 10, 60)]),
    ],
  },
  {
    id: "m-fb3",
    name: "Full body 3 dagen",
    gender: "man",
    level: "beginner",
    days: 3,
    focus: "Kracht en massa",
    desc: "Drie keer per week het hele lichaam met de grote basisoefeningen. Snelle vooruitgang voor beginners.",
    routines: [
      r("m-fb3-a", "Full body A", "⚡", [1, 5], [rx("squat", 3, 8, 150), rx("bench-press", 3, 8, 120), rx("bb-row", 3, 8, 120), rx("ohp", 3, 10, 90), rx("plank", 3, 45, 60)]),
      r("m-fb3-b", "Full body B", "⚡", [3], [rx("deadlift", 3, 5, 180), rx("incline-db", 3, 10, 90), rx("lat-pulldown", 3, 10, 90), rx("lunges", 3, 12, 90), rx("db-curl", 3, 12, 60), rx("triceps-pushdown", 3, 12, 60)]),
    ],
  },
  {
    id: "m-5x5",
    name: "Kracht 5×5",
    gender: "man",
    level: "gevorderd",
    days: 3,
    focus: "Pure kracht",
    desc: "Klassiek krachtprogramma: vijf sets van vijf op squat, bench, row, overhead press en deadlift.",
    routines: [
      r("m-5x5-a", "Kracht A", "🏋️", [1, 5], [rx("squat", 5, 5, 180), rx("bench-press", 5, 5, 180), rx("bb-row", 5, 5, 150), rx("face-pull", 3, 15, 60)]),
      r("m-5x5-b", "Kracht B", "🏋️", [3], [rx("squat", 5, 5, 180), rx("ohp", 5, 5, 180), rx("deadlift", 1, 5, 240), rx("pullups", 3, 8, 120)]),
    ],
  },
  {
    id: "m-ul4",
    name: "Upper / Lower",
    gender: "man",
    level: "gevorderd",
    days: 4,
    focus: "Spiermassa",
    desc: "Twee bovenlichaam- en twee onderlichaamsdagen. Elke spiergroep tweemaal per week.",
    routines: [
      r("m-ul4-ua", "Upper A", "🏋️", [1], [rx("bench-press", 4, 6, 150), rx("bb-row", 4, 8, 120), rx("ohp", 3, 8, 120), rx("lat-pulldown", 3, 10, 90), rx("bb-curl", 3, 10, 60), rx("skullcrusher", 3, 10, 60)]),
      r("m-ul4-la", "Lower A", "🦵", [2], [rx("squat", 4, 6, 180), rx("rdl", 3, 8, 120), rx("leg-press", 3, 12, 90), rx("leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 60), rx("hanging-leg-raise", 3, 12, 60)]),
      r("m-ul4-ub", "Upper B", "🏋️", [4], [rx("incline-db", 4, 8, 120), rx("pullups", 4, 8, 120), rx("db-shoulder-press", 3, 10, 90), rx("cable-row", 3, 12, 90), rx("lateral-raise", 3, 15, 60), rx("hammer-curl", 3, 12, 60), rx("overhead-triceps", 3, 12, 60)]),
      r("m-ul4-lb", "Lower B", "🦵", [5], [rx("deadlift", 3, 5, 180), rx("front-squat", 3, 8, 150), rx("split-squat", 3, 10, 90), rx("leg-ext", 3, 15, 60), rx("seated-calf", 4, 15, 60), rx("cable-crunch", 3, 15, 60)]),
    ],
  },
  {
    id: "m-bro5",
    name: "Bodybuilding split",
    gender: "man",
    level: "ervaren",
    days: 5,
    focus: "Spiergroep per dag",
    desc: "Borst, rug, schouders, benen en armen elk op een eigen dag met veel volume.",
    routines: [
      r("m-bro5-chest", "Borst", "🔥", [1], [rx("bench-press", 4, 8, 120), rx("incline-db", 4, 10, 90), rx("chest-press", 3, 12, 90), rx("cable-cross", 3, 15, 60), rx("dips", 3, 10, 90)]),
      r("m-bro5-back", "Rug", "💪", [2], [rx("deadlift", 3, 5, 180), rx("pullups", 4, 8, 120), rx("bb-row", 4, 8, 120), rx("cable-row", 3, 12, 90), rx("lat-pulldown", 3, 12, 90), rx("shrug", 3, 15, 60)]),
      r("m-bro5-sh", "Schouders", "🎯", [3], [rx("ohp", 4, 8, 120), rx("db-shoulder-press", 3, 10, 90), rx("lateral-raise", 4, 15, 60), rx("reverse-fly", 3, 15, 60), rx("face-pull", 3, 15, 60), rx("upright-row", 3, 12, 60)]),
      r("m-bro5-legs", "Benen", "🦵", [4], [rx("squat", 4, 8, 180), rx("leg-press", 4, 12, 120), rx("rdl", 3, 10, 120), rx("leg-ext", 3, 15, 60), rx("leg-curl", 3, 12, 60), rx("calf-raise", 5, 15, 60)]),
      r("m-bro5-arms", "Armen en core", "💥", [5], [rx("bb-curl", 4, 10, 60), rx("close-grip-bench", 4, 8, 90), rx("hammer-curl", 3, 12, 60), rx("skullcrusher", 3, 12, 60), rx("preacher-curl", 3, 12, 60), rx("triceps-pushdown", 3, 15, 60), rx("hanging-leg-raise", 3, 12, 60), rx("cable-crunch", 3, 15, 60)]),
    ],
  },
  {
    id: "m-ppl6",
    name: "Push / Pull / Legs",
    gender: "man",
    level: "ervaren",
    days: 6,
    focus: "Maximaal volume",
    desc: "Zes dagen per week, elke spiergroep tweemaal. Voor wie veel tijd en herstel heeft.",
    routines: [
      r("m-ppl6-push", "Push (borst, schouders, triceps)", "🔥", [1, 4], [rx("bench-press", 4, 8, 120), rx("incline-db", 3, 10, 90), rx("db-shoulder-press", 3, 10, 90), rx("lateral-raise", 3, 15, 60), rx("cable-cross", 3, 12, 60), rx("triceps-pushdown", 3, 12, 60), rx("overhead-triceps", 3, 12, 60)]),
      r("m-ppl6-pull", "Pull (rug, biceps)", "💪", [2, 5], [rx("deadlift", 3, 5, 180), rx("pullups", 3, 8, 120), rx("bb-row", 4, 8, 120), rx("cable-row", 3, 10, 90), rx("face-pull", 3, 15, 60), rx("bb-curl", 3, 10, 60), rx("hammer-curl", 3, 12, 60)]),
      r("m-ppl6-legs", "Legs (benen, core)", "🦵", [3, 6], [rx("squat", 4, 6, 180), rx("rdl", 3, 8, 120), rx("leg-press", 3, 12, 90), rx("leg-curl", 3, 12, 60), rx("leg-ext", 3, 15, 60), rx("calf-raise", 4, 15, 60), rx("hanging-leg-raise", 3, 12, 60)]),
    ],
  },
];

/* ---------------- Vrouwen ---------------- */

const WOMEN: Program[] = [
  {
    id: "v-fb2",
    name: "Full body starter",
    gender: "vrouw",
    level: "beginner",
    days: 2,
    focus: "Hele lichaam, billen en core",
    desc: "Twee complete trainingen per week met focus op billen, benen en een sterke core.",
    routines: [
      r("v-fb2-a", "Full body A", "✨", [2], [rx("goblet-squat", 3, 12, 75), rx("bw-bridge", 3, 15, 60), rx("db-row-two", 3, 12, 75), rx("incline-pushup", 3, 10, 60), rx("plank", 3, 30, 60)]),
      r("v-fb2-b", "Full body B", "✨", [5], [rx("reverse-lunge", 3, 10, 75), rx("stiff-leg-dl", 3, 12, 75), rx("lat-pulldown", 3, 12, 75), rx("db-shoulder-press", 3, 12, 60), rx("reverse-crunch", 3, 15, 45)]),
    ],
  },
  {
    id: "v-fb3",
    name: "Full body 3 dagen",
    gender: "vrouw",
    level: "beginner",
    days: 3,
    focus: "Strakker en sterker",
    desc: "Drie keer per week het hele lichaam, met extra aandacht voor billen en benen.",
    routines: [
      r("v-fb3-a", "Full body A", "✨", [1, 5], [rx("hip-thrust", 4, 10, 90), rx("goblet-squat", 3, 12, 75), rx("db-row", 3, 12, 75), rx("db-bench", 3, 10, 75), rx("side-plank", 3, 30, 45)]),
      r("v-fb3-b", "Full body B", "✨", [3], [rx("rdl", 3, 10, 90), rx("split-squat", 3, 10, 75), rx("lat-pulldown", 3, 12, 75), rx("lateral-raise", 3, 15, 45), rx("cable-kickback", 3, 15, 45), rx("crunch", 3, 20, 45)]),
    ],
  },
  {
    id: "v-gl4",
    name: "Glutes & legs focus",
    gender: "vrouw",
    level: "gevorderd",
    days: 4,
    focus: "Billen en benen",
    desc: "Twee onderlichaamsdagen met billen als prioriteit, aangevuld met bovenlichaam en core.",
    routines: [
      r("v-gl4-glutes", "Lower A · billen", "🍑", [1], [rx("hip-thrust", 4, 10, 120), rx("sumo-squat", 3, 12, 90), rx("rdl", 3, 10, 90), rx("cable-kickback", 3, 15, 45), rx("hip-abductor", 3, 20, 45), rx("glute-kickback", 3, 15, 45)]),
      r("v-gl4-upper", "Upper", "💪", [2], [rx("lat-pulldown", 3, 12, 75), rx("db-bench", 3, 10, 75), rx("cable-row", 3, 12, 75), rx("db-shoulder-press", 3, 12, 60), rx("lateral-raise", 3, 15, 45), rx("triceps-pushdown", 3, 15, 45)]),
      r("v-gl4-legs", "Lower B · benen", "🦵", [4], [rx("squat", 4, 8, 120), rx("leg-press", 3, 12, 90), rx("split-squat", 3, 10, 75), rx("leg-curl", 3, 12, 60), rx("leg-ext", 3, 15, 60), rx("calf-raise", 4, 15, 45)]),
      r("v-gl4-core", "Full body en core", "✨", [5], [rx("kb-swing", 4, 15, 60), rx("glute-bridge", 3, 12, 75), rx("db-row-two", 3, 12, 60), rx("incline-pushup", 3, 12, 60), rx("plank", 3, 45, 45), rx("reverse-crunch", 3, 15, 45)]),
    ],
  },
  {
    id: "v-ul4",
    name: "Upper / Lower",
    gender: "vrouw",
    level: "gevorderd",
    days: 4,
    focus: "Evenwichtig sterker",
    desc: "Twee bovenlichaam- en twee onderlichaamsdagen, met compound-oefeningen en glute-accenten.",
    routines: [
      r("v-ul4-la", "Lower A", "🦵", [1], [rx("squat", 4, 8, 120), rx("hip-thrust", 3, 10, 90), rx("reverse-lunge", 3, 10, 75), rx("leg-curl", 3, 12, 60), rx("calf-raise", 3, 15, 45)]),
      r("v-ul4-ua", "Upper A", "💪", [2], [rx("db-bench", 3, 10, 90), rx("lat-pulldown", 3, 12, 75), rx("db-shoulder-press", 3, 12, 60), rx("cable-row", 3, 12, 75), rx("db-curl", 3, 12, 45), rx("triceps-pushdown", 3, 15, 45)]),
      r("v-ul4-lb", "Lower B", "🍑", [4], [rx("rdl", 4, 8, 120), rx("leg-press", 3, 12, 90), rx("sumo-squat", 3, 12, 75), rx("hip-abductor", 3, 20, 45), rx("cable-kickback", 3, 15, 45)]),
      r("v-ul4-ub", "Upper B", "💪", [5], [rx("incline-db", 3, 10, 90), rx("pullups", 3, 6, 90), rx("lateral-raise", 3, 15, 45), rx("face-pull", 3, 15, 45), rx("hammer-curl", 3, 12, 45), rx("plank", 3, 45, 45)]),
    ],
  },
  {
    id: "v-tone5",
    name: "Shape & strength",
    gender: "vrouw",
    level: "ervaren",
    days: 5,
    focus: "Definitie en kracht",
    desc: "Vijf dagen: twee glute- en beendagen, twee bovenlichaamsdagen en een core- en conditiedag.",
    routines: [
      r("v-tone5-glutes", "Billen", "🍑", [1], [rx("hip-thrust", 5, 8, 120), rx("sumo-deadlift", 3, 8, 120), rx("pull-through", 3, 12, 60), rx("hip-abductor", 3, 20, 45), rx("single-leg-bridge", 3, 12, 45), rx("cable-kickback", 3, 15, 45)]),
      r("v-tone5-push", "Bovenlichaam push", "🔥", [2], [rx("db-bench", 4, 10, 90), rx("db-shoulder-press", 3, 10, 75), rx("incline-pushup", 3, 12, 60), rx("lateral-raise", 4, 15, 45), rx("overhead-triceps", 3, 12, 45), rx("kickback", 3, 15, 45)]),
      r("v-tone5-legs", "Benen", "🦵", [3], [rx("squat", 4, 8, 120), rx("rdl", 3, 10, 90), rx("walking-lunge", 3, 12, 75), rx("leg-ext", 3, 15, 60), rx("leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 45)]),
      r("v-tone5-pull", "Bovenlichaam pull", "💪", [4], [rx("lat-pulldown", 4, 10, 90), rx("cable-row", 3, 12, 75), rx("db-row", 3, 10, 75), rx("face-pull", 3, 15, 45), rx("reverse-fly", 3, 15, 45), rx("db-curl", 3, 12, 45)]),
      r("v-tone5-core", "Core en conditie", "⚡", [5], [rx("kb-swing", 4, 15, 60), rx("mountain-climbers", 3, 30, 45), rx("plank", 3, 45, 45), rx("side-plank", 3, 30, 45), rx("hanging-leg-raise", 3, 12, 45), rx("air-bike", 1, 10, 0)]),
    ],
  },
];

/* ---------------- Voor iedereen ---------------- */

const EVERYONE: Program[] = [
  {
    id: "a-home3",
    name: "Thuis zonder toestellen",
    gender: "iedereen",
    level: "beginner",
    days: 3,
    focus: "Lichaamsgewicht",
    desc: "Drie trainingen met alleen je lichaamsgewicht (en eventueel dumbbells). Overal te doen.",
    routines: [
      r("a-home3-a", "Thuis A", "🏠", [1, 5], [rx("pushups", 3, 12, 60), rx("bw-lunge", 3, 12, 60), rx("bw-bridge", 3, 15, 45), rx("plank", 3, 40, 45), rx("mountain-climbers", 3, 30, 45)]),
      r("a-home3-b", "Thuis B", "🏠", [3], [rx("db-squat", 3, 15, 60), rx("incline-pushup", 3, 12, 60), rx("single-leg-bridge", 3, 12, 45), rx("side-plank", 3, 30, 45), rx("crunch", 3, 20, 45)]),
    ],
  },
  {
    id: "a-fb3",
    name: "Full body basis",
    gender: "iedereen",
    level: "gevorderd",
    days: 3,
    focus: "Compleet en efficiënt",
    desc: "Drie efficiënte full-bodytrainingen rond squat, hinge, push, pull en core.",
    routines: [
      r("a-fb3-a", "Full body A", "⚡", [1], [rx("squat", 3, 8, 150), rx("db-bench", 3, 10, 90), rx("cable-row", 3, 12, 90), rx("hip-thrust", 3, 10, 90), rx("plank", 3, 45, 60)]),
      r("a-fb3-b", "Full body B", "⚡", [3], [rx("rdl", 3, 8, 150), rx("ohp", 3, 10, 90), rx("lat-pulldown", 3, 12, 90), rx("split-squat", 3, 10, 90), rx("cable-crunch", 3, 15, 60)]),
      r("a-fb3-c", "Full body C", "⚡", [5], [rx("leg-press", 3, 12, 120), rx("incline-db", 3, 10, 90), rx("db-row", 3, 10, 90), rx("kb-swing", 3, 15, 60), rx("hanging-leg-raise", 3, 12, 60)]),
    ],
  },
];

export const PROGRAMS: Program[] = [...MEN, ...WOMEN, ...EVERYONE];

const LEVEL_ORDER: Record<Level, number> = { beginner: 0, gevorderd: 1, ervaren: 2 };

/** Programma's gesorteerd op hoe goed ze passen bij geslacht, aantal dagen en niveau */
export function recommendPrograms(gender: Gender, days: number, level: Level): Program[] {
  const genderOk = (p: Program) => p.gender === "iedereen" || (gender === "man" && p.gender === "man") || (gender === "vrouw" && p.gender === "vrouw") || gender === "anders";
  return PROGRAMS.filter(genderOk)
    .map((p) => ({ p, score: Math.abs(p.days - days) * 3 + Math.abs(LEVEL_ORDER[p.level] - LEVEL_ORDER[level]) * 2 + (p.gender === "iedereen" && gender !== "anders" ? 1 : 0) }))
    .sort((a, b) => a.score - b.score)
    .map((x) => x.p);
}

export const programById = (id: string) => PROGRAMS.find((p) => p.id === id);
