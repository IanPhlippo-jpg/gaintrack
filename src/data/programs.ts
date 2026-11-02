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

// Vaste weekindeling per aantal trainingsdagen (0 = zondag).
const D2 = [[1], [4]];
const D3 = [[1], [3], [5]];
const D4 = [[1], [2], [4], [5]];
const D5 = [[1], [2], [3], [4], [5]];
// 6 dagen: push/pull/legs-paren, zie de programma's zelf.

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
      r("m-fb2-a", "Full body A", "⚡", D2[0], [rx("goblet-squat", 3, 10, 90), rx("db-bench", 3, 10, 90), rx("db-row", 3, 10, 90), rx("db-shoulder-press", 2, 12, 60), rx("plank", 3, 40, 60)]),
      r("m-fb2-b", "Full body B", "⚡", D2[1], [rx("leg-press", 3, 12, 90), rx("lat-pulldown", 3, 10, 90), rx("incline-db", 3, 10, 90), rx("rdl", 3, 10, 90), rx("hanging-leg-raise", 3, 10, 60)]),
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
    id: "m-ppl3",
    name: "Push / Pull / Legs 3 dagen",
    gender: "man",
    level: "gevorderd",
    days: 3,
    focus: "Spiermassa",
    desc: "Elke spiergroep één keer per week met veel volume per sessie: push, pull en benen op drie vaste dagen.",
    routines: [
      r("m-ppl3-push", "Push", "🔥", D3[0], [rx("bench-press", 4, 8, 120), rx("incline-db", 3, 10, 90), rx("db-shoulder-press", 3, 10, 90), rx("lateral-raise", 3, 15, 60), rx("cable-cross", 3, 12, 60), rx("triceps-pushdown", 3, 12, 60), rx("overhead-triceps", 3, 12, 60)]),
      r("m-ppl3-pull", "Pull", "💪", D3[1], [rx("deadlift", 3, 5, 180), rx("pullups", 3, 8, 120), rx("bb-row", 4, 8, 120), rx("cable-row", 3, 10, 90), rx("face-pull", 3, 15, 60), rx("bb-curl", 3, 10, 60), rx("hammer-curl", 3, 12, 60)]),
      r("m-ppl3-legs", "Legs", "🦵", D3[2], [rx("squat", 4, 6, 180), rx("rdl", 3, 8, 120), rx("leg-press", 3, 12, 90), rx("leg-curl", 3, 12, 60), rx("leg-ext", 3, 15, 60), rx("calf-raise", 4, 15, 60), rx("hanging-leg-raise", 3, 12, 60)]),
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
      r("m-ul4-ua", "Upper A", "🏋️", D4[0], [rx("bench-press", 4, 6, 150), rx("bb-row", 4, 8, 120), rx("ohp", 3, 8, 120), rx("lat-pulldown", 3, 10, 90), rx("bb-curl", 3, 10, 60), rx("skullcrusher", 3, 10, 60)]),
      r("m-ul4-la", "Lower A", "🦵", D4[1], [rx("squat", 4, 6, 180), rx("rdl", 3, 8, 120), rx("leg-press", 3, 12, 90), rx("leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 60), rx("hanging-leg-raise", 3, 12, 60)]),
      r("m-ul4-ub", "Upper B", "🏋️", D4[2], [rx("incline-db", 4, 8, 120), rx("pullups", 4, 8, 120), rx("db-shoulder-press", 3, 10, 90), rx("cable-row", 3, 12, 90), rx("lateral-raise", 3, 15, 60), rx("hammer-curl", 3, 12, 60), rx("overhead-triceps", 3, 12, 60)]),
      r("m-ul4-lb", "Lower B", "🦵", D4[3], [rx("deadlift", 3, 5, 180), rx("front-squat", 3, 8, 150), rx("split-squat", 3, 10, 90), rx("leg-ext", 3, 15, 60), rx("seated-calf", 4, 15, 60), rx("cable-crunch", 3, 15, 60)]),
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
      r("m-bro5-chest", "Borst", "🔥", D5[0], [rx("bench-press", 4, 8, 120), rx("incline-db", 4, 10, 90), rx("chest-press", 3, 12, 90), rx("cable-cross", 3, 15, 60), rx("dips", 3, 10, 90)]),
      r("m-bro5-back", "Rug", "💪", D5[1], [rx("deadlift", 3, 5, 180), rx("pullups", 4, 8, 120), rx("bb-row", 4, 8, 120), rx("cable-row", 3, 12, 90), rx("lat-pulldown", 3, 12, 90), rx("shrug", 3, 15, 60)]),
      r("m-bro5-sh", "Schouders", "🎯", D5[2], [rx("ohp", 4, 8, 120), rx("db-shoulder-press", 3, 10, 90), rx("lateral-raise", 4, 15, 60), rx("reverse-fly", 3, 15, 60), rx("face-pull", 3, 15, 60), rx("upright-row", 3, 12, 60)]),
      r("m-bro5-legs", "Benen", "🦵", D5[3], [rx("squat", 4, 8, 180), rx("leg-press", 4, 12, 120), rx("rdl", 3, 10, 120), rx("leg-ext", 3, 15, 60), rx("leg-curl", 3, 12, 60), rx("calf-raise", 5, 15, 60)]),
      r("m-bro5-arms", "Armen en core", "💥", D5[4], [rx("bb-curl", 4, 10, 60), rx("close-grip-bench", 4, 8, 90), rx("hammer-curl", 3, 12, 60), rx("skullcrusher", 3, 12, 60), rx("preacher-curl", 3, 12, 60), rx("triceps-pushdown", 3, 15, 60), rx("hanging-leg-raise", 3, 12, 60), rx("cable-crunch", 3, 15, 60)]),
    ],
  },
  {
    id: "m-ulppl5",
    name: "Upper / Lower + Push / Pull / Legs",
    gender: "man",
    level: "gevorderd",
    days: 5,
    focus: "Kracht en massa",
    desc: "Twee zware krachtdagen (upper en lower) gevolgd door drie volumedagen push, pull en legs. Alles tweemaal per week.",
    routines: [
      r("m-ulppl5-upper", "Upper kracht", "🏋️", D5[0], [rx("bench-press", 4, 5, 180), rx("bb-row", 4, 6, 150), rx("ohp", 3, 6, 150), rx("pullups", 3, 8, 120), rx("face-pull", 3, 15, 60)]),
      r("m-ulppl5-lower", "Lower kracht", "🦵", D5[1], [rx("squat", 4, 5, 180), rx("deadlift", 3, 5, 240), rx("leg-press", 3, 10, 120), rx("leg-curl", 3, 10, 90), rx("plank", 3, 45, 60)]),
      r("m-ulppl5-push", "Push volume", "🔥", D5[2], [rx("incline-db", 4, 10, 90), rx("db-shoulder-press", 3, 10, 90), rx("chest-press", 3, 12, 90), rx("lateral-raise", 4, 15, 60), rx("cable-cross", 3, 15, 60), rx("triceps-pushdown", 3, 12, 60), rx("overhead-triceps", 3, 12, 60)]),
      r("m-ulppl5-pull", "Pull volume", "💪", D5[3], [rx("lat-pulldown", 4, 10, 90), rx("cable-row", 4, 12, 90), rx("db-row", 3, 10, 90), rx("reverse-fly", 3, 15, 60), rx("shrug", 3, 15, 60), rx("bb-curl", 3, 10, 60), rx("hammer-curl", 3, 12, 60)]),
      r("m-ulppl5-legs", "Legs volume", "🦵", D5[4], [rx("front-squat", 3, 8, 150), rx("rdl", 3, 10, 120), rx("split-squat", 3, 10, 90), rx("leg-ext", 3, 15, 60), rx("seated-leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 60), rx("hanging-leg-raise", 3, 12, 60)]),
    ],
  },
  {
    id: "m-ppl6",
    name: "Push / Pull / Legs 6 dagen",
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

/* ---------------- Vrouwen (met nadruk op billen) ---------------- */

const WOMEN: Program[] = [
  {
    id: "v-fb2",
    name: "Glute starter 2 dagen",
    gender: "vrouw",
    level: "beginner",
    days: 2,
    focus: "Billen, benen en core",
    desc: "Twee complete trainingen per week met hip thrusts en bruggen voor de billen, plus de basis voor rug, borst en core.",
    routines: [
      r("v-fb2-a", "Full body A · billen", "🍑", D2[0], [rx("hip-thrust", 4, 12, 90), rx("goblet-squat", 3, 12, 75), rx("db-row-two", 3, 12, 75), rx("incline-pushup", 3, 10, 60), rx("hip-abductor", 3, 20, 45), rx("plank", 3, 30, 60)]),
      r("v-fb2-b", "Full body B · benen", "✨", D2[1], [rx("reverse-lunge", 3, 10, 75), rx("stiff-leg-dl", 3, 12, 75), rx("lat-pulldown", 3, 12, 75), rx("db-shoulder-press", 3, 12, 60), rx("bw-bridge", 3, 15, 45), rx("reverse-crunch", 3, 15, 45)]),
    ],
  },
  {
    id: "v-fb3",
    name: "Full body 3 dagen",
    gender: "vrouw",
    level: "beginner",
    days: 3,
    focus: "Strakker en sterker",
    desc: "Drie keer per week het hele lichaam, elke training begint met een glute-oefening.",
    routines: [
      r("v-fb3-a", "Full body A", "✨", [1, 5], [rx("hip-thrust", 4, 10, 90), rx("goblet-squat", 3, 12, 75), rx("db-row", 3, 12, 75), rx("db-bench", 3, 10, 75), rx("side-plank", 3, 30, 45)]),
      r("v-fb3-b", "Full body B", "✨", [3], [rx("rdl", 3, 10, 90), rx("split-squat", 3, 10, 75), rx("lat-pulldown", 3, 12, 75), rx("lateral-raise", 3, 15, 45), rx("cable-kickback", 3, 15, 45), rx("crunch", 3, 20, 45)]),
    ],
  },
  {
    id: "v-glute3",
    name: "Glutes focus 3 dagen",
    gender: "vrouw",
    level: "gevorderd",
    days: 3,
    focus: "Billen als prioriteit",
    desc: "Twee onderlichaamsdagen met billen voorop (hip thrust, RDL, abductie, kickbacks) en één bovenlichaam- en coredag.",
    routines: [
      r("v-glute3-a", "Billen en hamstrings", "🍑", D3[0], [rx("hip-thrust", 4, 10, 120), rx("rdl", 4, 10, 90), rx("sumo-squat", 3, 12, 75), rx("cable-kickback", 3, 15, 45), rx("hip-abductor", 3, 20, 45), rx("single-leg-bridge", 3, 12, 45)]),
      r("v-glute3-b", "Bovenlichaam en core", "💪", D3[1], [rx("lat-pulldown", 3, 12, 75), rx("db-bench", 3, 10, 75), rx("cable-row", 3, 12, 75), rx("db-shoulder-press", 3, 12, 60), rx("face-pull", 3, 15, 45), rx("plank", 3, 45, 45), rx("reverse-crunch", 3, 15, 45)]),
      r("v-glute3-c", "Billen en quads", "🍑", D3[2], [rx("squat", 4, 8, 120), rx("glute-bridge", 3, 12, 90), rx("split-squat", 3, 10, 75), rx("pull-through", 3, 12, 60), rx("glute-kickback", 3, 15, 45), rx("calf-raise", 3, 15, 45)]),
    ],
  },
  {
    id: "v-gl4",
    name: "Glutes & legs 4 dagen",
    gender: "vrouw",
    level: "gevorderd",
    days: 4,
    focus: "Billen en benen",
    desc: "Twee onderlichaamsdagen met billen als prioriteit, aangevuld met bovenlichaam en een full-body-coredag.",
    routines: [
      r("v-gl4-glutes", "Lower A · billen", "🍑", D4[0], [rx("hip-thrust", 4, 10, 120), rx("sumo-squat", 3, 12, 90), rx("rdl", 3, 10, 90), rx("cable-kickback", 3, 15, 45), rx("hip-abductor", 3, 20, 45), rx("glute-kickback", 3, 15, 45)]),
      r("v-gl4-upper", "Upper", "💪", D4[1], [rx("lat-pulldown", 3, 12, 75), rx("db-bench", 3, 10, 75), rx("cable-row", 3, 12, 75), rx("db-shoulder-press", 3, 12, 60), rx("lateral-raise", 3, 15, 45), rx("triceps-pushdown", 3, 15, 45)]),
      r("v-gl4-legs", "Lower B · benen", "🦵", D4[2], [rx("squat", 4, 8, 120), rx("leg-press", 3, 12, 90), rx("split-squat", 3, 10, 75), rx("leg-curl", 3, 12, 60), rx("leg-ext", 3, 15, 60), rx("calf-raise", 4, 15, 45)]),
      r("v-gl4-core", "Full body en core", "✨", D4[3], [rx("kb-swing", 4, 15, 60), rx("glute-bridge", 3, 12, 75), rx("db-row-two", 3, 12, 60), rx("incline-pushup", 3, 12, 60), rx("plank", 3, 45, 45), rx("reverse-crunch", 3, 15, 45)]),
    ],
  },
  {
    id: "v-ul4",
    name: "Upper / Lower 4 dagen",
    gender: "vrouw",
    level: "gevorderd",
    days: 4,
    focus: "Evenwichtig sterker",
    desc: "Twee bovenlichaam- en twee onderlichaamsdagen, met compound-oefeningen en glute-accenten.",
    routines: [
      r("v-ul4-la", "Lower A", "🦵", D4[0], [rx("squat", 4, 8, 120), rx("hip-thrust", 3, 10, 90), rx("reverse-lunge", 3, 10, 75), rx("leg-curl", 3, 12, 60), rx("calf-raise", 3, 15, 45)]),
      r("v-ul4-ua", "Upper A", "💪", D4[1], [rx("db-bench", 3, 10, 90), rx("lat-pulldown", 3, 12, 75), rx("db-shoulder-press", 3, 12, 60), rx("cable-row", 3, 12, 75), rx("db-curl", 3, 12, 45), rx("triceps-pushdown", 3, 15, 45)]),
      r("v-ul4-lb", "Lower B", "🍑", D4[2], [rx("rdl", 4, 8, 120), rx("leg-press", 3, 12, 90), rx("sumo-squat", 3, 12, 75), rx("hip-abductor", 3, 20, 45), rx("cable-kickback", 3, 15, 45)]),
      r("v-ul4-ub", "Upper B", "💪", D4[3], [rx("incline-db", 3, 10, 90), rx("pullups", 3, 6, 90), rx("lateral-raise", 3, 15, 45), rx("face-pull", 3, 15, 45), rx("hammer-curl", 3, 12, 45), rx("plank", 3, 45, 45)]),
    ],
  },
  {
    id: "v-booty5",
    name: "Booty builder 5 dagen",
    gender: "vrouw",
    level: "ervaren",
    days: 5,
    focus: "Maximale glute-groei",
    desc: "Drie glute- en beendagen (zwaar, volume en pump) en twee bovenlichaamsdagen. Billen worden drie keer per week getraind.",
    routines: [
      r("v-booty5-heavy", "Billen zwaar", "🍑", D5[0], [rx("hip-thrust", 5, 6, 150), rx("sumo-deadlift", 4, 6, 150), rx("split-squat", 3, 8, 90), rx("hip-abductor", 3, 15, 45), rx("plank", 3, 45, 45)]),
      r("v-booty5-upper-a", "Bovenlichaam A", "💪", D5[1], [rx("lat-pulldown", 4, 10, 90), rx("db-bench", 3, 10, 90), rx("cable-row", 3, 12, 75), rx("lateral-raise", 3, 15, 45), rx("face-pull", 3, 15, 45), rx("triceps-pushdown", 3, 15, 45)]),
      r("v-booty5-volume", "Billen en benen volume", "🦵", D5[2], [rx("squat", 4, 10, 120), rx("rdl", 4, 10, 90), rx("leg-press", 3, 15, 90), rx("walking-lunge", 3, 12, 75), rx("leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 45)]),
      r("v-booty5-upper-b", "Bovenlichaam B", "💪", D5[3], [rx("db-shoulder-press", 3, 10, 90), rx("db-row", 3, 10, 75), rx("incline-pushup", 3, 12, 60), rx("reverse-fly", 3, 15, 45), rx("db-curl", 3, 12, 45), rx("overhead-triceps", 3, 12, 45)]),
      r("v-booty5-pump", "Billen pump", "🔥", D5[4], [rx("glute-bridge", 4, 15, 60), rx("pull-through", 3, 15, 60), rx("cable-kickback", 4, 15, 45), rx("hip-abductor", 4, 25, 45), rx("single-leg-bridge", 3, 15, 45), rx("glute-kickback", 3, 20, 30), rx("kb-swing", 3, 20, 60)]),
    ],
  },
  {
    id: "v-tone5",
    name: "Shape & strength 5 dagen",
    gender: "vrouw",
    level: "ervaren",
    days: 5,
    focus: "Definitie en kracht",
    desc: "Vijf dagen: twee glute- en beendagen, twee bovenlichaamsdagen en een core- en conditiedag.",
    routines: [
      r("v-tone5-glutes", "Billen", "🍑", D5[0], [rx("hip-thrust", 5, 8, 120), rx("sumo-deadlift", 3, 8, 120), rx("pull-through", 3, 12, 60), rx("hip-abductor", 3, 20, 45), rx("single-leg-bridge", 3, 12, 45), rx("cable-kickback", 3, 15, 45)]),
      r("v-tone5-push", "Bovenlichaam push", "🔥", D5[1], [rx("db-bench", 4, 10, 90), rx("db-shoulder-press", 3, 10, 75), rx("incline-pushup", 3, 12, 60), rx("lateral-raise", 4, 15, 45), rx("overhead-triceps", 3, 12, 45), rx("kickback", 3, 15, 45)]),
      r("v-tone5-legs", "Benen", "🦵", D5[2], [rx("squat", 4, 8, 120), rx("rdl", 3, 10, 90), rx("walking-lunge", 3, 12, 75), rx("leg-ext", 3, 15, 60), rx("leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 45)]),
      r("v-tone5-pull", "Bovenlichaam pull", "💪", D5[3], [rx("lat-pulldown", 4, 10, 90), rx("cable-row", 3, 12, 75), rx("db-row", 3, 10, 75), rx("face-pull", 3, 15, 45), rx("reverse-fly", 3, 15, 45), rx("db-curl", 3, 12, 45)]),
      r("v-tone5-core", "Core en conditie", "⚡", D5[4], [rx("kb-swing", 4, 15, 60), rx("mountain-climbers", 3, 30, 45), rx("plank", 3, 45, 45), rx("side-plank", 3, 30, 45), rx("hanging-leg-raise", 3, 12, 45), rx("air-bike", 1, 10, 0)]),
    ],
  },
  {
    id: "v-ppl6",
    name: "Glute PPL 6 dagen",
    gender: "vrouw",
    level: "ervaren",
    days: 6,
    focus: "Billen tweemaal per week, alles in balans",
    desc: "Push, pull en een glute-/beendag, twee keer per week. De tweede beendag is volledig op billen gericht.",
    routines: [
      r("v-ppl6-push", "Push", "🔥", [1, 4], [rx("db-bench", 4, 10, 90), rx("db-shoulder-press", 3, 10, 75), rx("incline-pushup", 3, 12, 60), rx("lateral-raise", 4, 15, 45), rx("cable-cross", 3, 15, 60), rx("triceps-pushdown", 3, 15, 45)]),
      r("v-ppl6-pull", "Pull", "💪", [2, 5], [rx("lat-pulldown", 4, 10, 90), rx("cable-row", 3, 12, 75), rx("db-row", 3, 10, 75), rx("face-pull", 3, 15, 45), rx("reverse-fly", 3, 15, 45), rx("db-curl", 3, 12, 45), rx("plank", 3, 45, 45)]),
      r("v-ppl6-legs", "Benen en billen", "🦵", [3], [rx("squat", 4, 8, 120), rx("rdl", 4, 10, 90), rx("leg-press", 3, 12, 90), rx("walking-lunge", 3, 12, 75), rx("leg-curl", 3, 12, 60), rx("calf-raise", 4, 15, 45)]),
      r("v-ppl6-glutes", "Billen", "🍑", [6], [rx("hip-thrust", 5, 8, 120), rx("sumo-deadlift", 3, 8, 120), rx("glute-bridge", 3, 12, 75), rx("cable-kickback", 3, 15, 45), rx("hip-abductor", 4, 20, 45), rx("single-leg-bridge", 3, 12, 45), rx("kb-swing", 3, 15, 60)]),
    ],
  },
];

/* ---------------- Voor iedereen ---------------- */

const EVERYONE: Program[] = [
  {
    id: "a-home2",
    name: "Thuis 2 dagen",
    gender: "iedereen",
    level: "beginner",
    days: 2,
    focus: "Lichaamsgewicht",
    desc: "Twee korte trainingen met alleen je lichaamsgewicht. Ideaal om te starten of op drukke weken.",
    routines: [
      r("a-home2-a", "Thuis A", "🏠", D2[0], [rx("pushups", 3, 12, 60), rx("bw-lunge", 3, 12, 60), rx("bw-bridge", 3, 15, 45), rx("plank", 3, 40, 45)]),
      r("a-home2-b", "Thuis B", "🏠", D2[1], [rx("db-squat", 3, 15, 60), rx("incline-pushup", 3, 12, 60), rx("single-leg-bridge", 3, 12, 45), rx("mountain-climbers", 3, 30, 45), rx("crunch", 3, 20, 45)]),
    ],
  },
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
      r("a-fb3-a", "Full body A", "⚡", D3[0], [rx("squat", 3, 8, 150), rx("db-bench", 3, 10, 90), rx("cable-row", 3, 12, 90), rx("hip-thrust", 3, 10, 90), rx("plank", 3, 45, 60)]),
      r("a-fb3-b", "Full body B", "⚡", D3[1], [rx("rdl", 3, 8, 150), rx("ohp", 3, 10, 90), rx("lat-pulldown", 3, 12, 90), rx("split-squat", 3, 10, 90), rx("cable-crunch", 3, 15, 60)]),
      r("a-fb3-c", "Full body C", "⚡", D3[2], [rx("leg-press", 3, 12, 120), rx("incline-db", 3, 10, 90), rx("db-row", 3, 10, 90), rx("kb-swing", 3, 15, 60), rx("hanging-leg-raise", 3, 12, 60)]),
    ],
  },
  {
    id: "a-ul4",
    name: "Upper / Lower 4 dagen",
    gender: "iedereen",
    level: "gevorderd",
    days: 4,
    focus: "Evenwichtig",
    desc: "Twee bovenlichaam- en twee onderlichaamsdagen met de grote basisoefeningen. Past bij elk doel.",
    routines: [
      r("a-ul4-ua", "Upper A", "🏋️", D4[0], [rx("bench-press", 4, 8, 120), rx("cable-row", 4, 10, 90), rx("db-shoulder-press", 3, 10, 90), rx("lat-pulldown", 3, 12, 90), rx("db-curl", 3, 12, 60), rx("triceps-pushdown", 3, 12, 60)]),
      r("a-ul4-la", "Lower A", "🦵", D4[1], [rx("squat", 4, 8, 150), rx("rdl", 3, 10, 120), rx("leg-press", 3, 12, 90), rx("leg-curl", 3, 12, 60), rx("calf-raise", 3, 15, 60), rx("plank", 3, 45, 45)]),
      r("a-ul4-ub", "Upper B", "🏋️", D4[2], [rx("incline-db", 4, 10, 90), rx("db-row", 4, 10, 90), rx("lateral-raise", 3, 15, 60), rx("face-pull", 3, 15, 60), rx("hammer-curl", 3, 12, 60), rx("overhead-triceps", 3, 12, 60)]),
      r("a-ul4-lb", "Lower B", "🍑", D4[3], [rx("hip-thrust", 4, 10, 120), rx("front-squat", 3, 8, 150), rx("split-squat", 3, 10, 90), rx("leg-ext", 3, 15, 60), rx("hip-abductor", 3, 20, 45), rx("hanging-leg-raise", 3, 12, 60)]),
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
