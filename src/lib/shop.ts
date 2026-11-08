/**
 * Coins, winkel en het diertje.
 *
 * Coins worden afgeleid uit je XP (zoals je level): 1 coin per 10 XP en bij elk nieuw level een pot van 50 × level.
 * Wat je uitgeeft staat in de store (coinsSpent). Zo krijgen bestaande spelers meteen coins voor hun huidige level
 * en kan een coin nooit twee keer worden uitgekeerd.
 */
import { levelFromXp } from "@/lib/gamification";
import type { UnlockKind } from "@/lib/unlocks";

export const COINS_PER_XP = 1 / 10;
export const levelCoins = (level: number) => (level <= 1 ? 0 : 50 * level);

export function coinsEarned(xp: number) {
  const level = levelFromXp(xp);
  let c = Math.floor(Math.max(0, xp) * COINS_PER_XP);
  for (let l = 2; l <= level; l++) c += levelCoins(l);
  return c;
}

/* ---------------- Diertje ---------------- */

export type PetSlot = "hoofd" | "ogen" | "nek" | "hand";
export type PetStat = "food" | "clean" | "fun";

export interface Pet {
  name: string;
  color: string;
  /** groeipunten: bepalen het stadium */
  growth: number;
  food: number;
  clean: number;
  fun: number;
  /** moment waarop food/clean/fun laatst berekend zijn */
  updatedAt: number;
  createdAt: number;
  equipped: Partial<Record<PetSlot, string>>;
  background?: string;
}

/** Hoeveel punten per uur er af gaan: na een dag zonder eten heeft je diertje honger. */
const DECAY: Record<PetStat, number> = { food: 3, clean: 1.6, fun: 2.2 };
const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function petNow(p: Pet, now = Date.now()): Pet {
  const h = Math.max(0, (now - p.updatedAt) / 3_600_000);
  return { ...p, food: clamp(p.food - DECAY.food * h), clean: clamp(p.clean - DECAY.clean * h), fun: clamp(p.fun - DECAY.fun * h), updatedAt: now };
}

export const STAGES = [
  { id: "baby", name: "Baby", from: 0, scale: 0.62 },
  { id: "kind", name: "Kind", from: 120, scale: 0.76 },
  { id: "tiener", name: "Tiener", from: 350, scale: 0.88 },
  { id: "volwassen", name: "Volwassen", from: 800, scale: 1 },
] as const;
export type Stage = (typeof STAGES)[number];

export function stageOf(growth: number): { stage: Stage; next: Stage | null; pct: number } {
  let i = 0;
  while (i < STAGES.length - 1 && growth >= STAGES[i + 1].from) i++;
  const stage = STAGES[i];
  const next = STAGES[i + 1] ?? null;
  return { stage, next, pct: next ? ((growth - stage.from) / (next.from - stage.from)) * 100 : 100 };
}

export type Mood = "blij" | "oke" | "verdrietig" | "slaapt";
export function moodOf(p: Pet, now = new Date()): Mood {
  const h = now.getHours();
  if (h >= 23 || h < 7) return "slaapt";
  const low = Math.min(p.food, p.clean, p.fun);
  const avg = (p.food + p.clean + p.fun) / 3;
  if (low < 15 || avg < 35) return "verdrietig";
  return avg >= 65 ? "blij" : "oke";
}

/** Wat je diertje nu het meest nodig heeft, in één zin. */
export function petNeed(p: Pet): string {
  const m = moodOf(p);
  if (m === "slaapt") return `${p.name} slaapt. Morgen weer actief.`;
  const lowest = (["food", "clean", "fun"] as PetStat[]).sort((a, b) => p[a] - p[b])[0];
  if (p[lowest] >= 60) return `${p.name} voelt zich top.`;
  if (p[lowest] >= 35) return { food: `${p.name} lust wel een hapje.`, clean: `${p.name} wil graag geborsteld worden.`, fun: `${p.name} wil graag spelen.` }[lowest];
  return { food: `${p.name} heeft honger.`, clean: `${p.name} heeft dringend een wasbeurt nodig.`, fun: `${p.name} verveelt zich. Tijd om te spelen.` }[lowest];
}

/** Een verwaarloosd diertje groeit maar half zo snel. */
export const growthFactor = (p: Pet) => (Math.min(p.food, p.clean, p.fun) < 20 ? 0.5 : 1);

export const PET_COLORS: Record<string, { label: string; body: string; belly: string; cheek: string; dark: string }> = {
  lila: { label: "Lila", body: "#A99AE0", belly: "#DCD5F5", cheek: "#F2A7C3", dark: "#5A3B8C" },
  munt: { label: "Munt", body: "#7FD6B9", belly: "#D2F4E8", cheek: "#F2A7A7", dark: "#1F6B57" },
  perzik: { label: "Perzik", body: "#FFB38A", belly: "#FFE3D2", cheek: "#F27A7A", dark: "#8C4A2A" },
  hemel: { label: "Hemelsblauw", body: "#8FC7FF", belly: "#DCEEFF", cheek: "#F2A7C3", dark: "#2A4F8C" },
  goud: { label: "Goud", body: "#E8C462", belly: "#FAEEC4", cheek: "#F29A7A", dark: "#7A5A12" },
  nacht: { label: "Nacht", body: "#4A4470", belly: "#8D86B8", cheek: "#C77AA8", dark: "#1A1730" },
};

export const PET_BACKGROUNDS: Record<string, { label: string; from: string; to: string }> = {
  standaard: { label: "Kamer", from: "#2A2150", to: "#1A1433" },
  gym: { label: "Gym", from: "#3A2A1E", to: "#1C1410" },
  strand: { label: "Strand", from: "#4FB3D9", to: "#F2D59B" },
  bos: { label: "Bos", from: "#2F5D45", to: "#13291D" },
  ruimte: { label: "Ruimte", from: "#0B0B2A", to: "#3A1E5C" },
};

/* ---------------- Winkel ---------------- */

export type ShopCat = "eten" | "verzorging" | "accessoire" | "stijl" | "profiel";

export interface ShopItem {
  id: string;
  cat: ShopCat;
  name: string;
  desc: string;
  price: number;
  icon: string;
  /** verbruiksartikel (eten, verzorging): effect op het diertje */
  effect?: Partial<Record<PetStat | "growth", number>>;
  /** accessoire: plaats op het diertje */
  slot?: PetSlot;
  /** kleur of achtergrond van het diertje */
  petColor?: string;
  petBackground?: string;
  /** profielitem: zelfde systeem als de levelbeloningen */
  cosmetic?: { kind: Exclude<UnlockKind, "perk">; value: string };
}

export const SHOP: ShopItem[] = [
  // Eten
  { id: "appel", cat: "eten", name: "Appel", desc: "Gezond tussendoortje.", price: 5, icon: "🍎", effect: { food: 15, growth: 3 } },
  { id: "banaan", cat: "eten", name: "Banaan", desc: "Snelle energie voor de training.", price: 7, icon: "🍌", effect: { food: 20, fun: 5, growth: 4 } },
  { id: "eiwitreep", cat: "eten", name: "Eiwitreep", desc: "Spieren groeien ervan.", price: 12, icon: "🍫", effect: { food: 30, growth: 8 } },
  { id: "shake", cat: "eten", name: "Eiwitshake", desc: "Na het sporten: dubbele groei.", price: 18, icon: "🥤", effect: { food: 35, growth: 14 } },
  { id: "kip-rijst", cat: "eten", name: "Kip met rijst", desc: "Volledige maaltijd, lang verzadigd.", price: 25, icon: "🍱", effect: { food: 60, growth: 16 } },
  { id: "pannenkoek", cat: "eten", name: "Pannenkoeken", desc: "Cheat meal: vrolijk maar weinig groei.", price: 15, icon: "🥞", effect: { food: 35, fun: 20, growth: 2 } },
  // Verzorging
  { id: "borstel", cat: "verzorging", name: "Borstelbeurt", desc: "Glanzende vacht.", price: 6, icon: "🪮", effect: { clean: 25, fun: 5, growth: 2 } },
  { id: "bad", cat: "verzorging", name: "Bubbelbad", desc: "Helemaal fris na het zweten.", price: 10, icon: "🛁", effect: { clean: 55, growth: 3 } },
  { id: "bal", cat: "verzorging", name: "Balletje gooien", desc: "Even spelen.", price: 8, icon: "⚽", effect: { fun: 30, food: -5, growth: 3 } },
  { id: "massage", cat: "verzorging", name: "Massage", desc: "Herstel na een zware dag.", price: 14, icon: "💆", effect: { fun: 25, clean: 10, growth: 5 } },
  { id: "vitamines", cat: "verzorging", name: "Vitamines", desc: "Extra groei, één per dag is genoeg.", price: 20, icon: "💊", effect: { growth: 20 } },
  // Accessoires (blijven van jou)
  { id: "acc-pet", cat: "accessoire", name: "Petje", desc: "Sportief petje.", price: 60, icon: "🧢", slot: "hoofd" },
  { id: "acc-zweetband", cat: "accessoire", name: "Zweetband", desc: "Voor de echte harde werkers.", price: 45, icon: "🎽", slot: "hoofd" },
  { id: "acc-koptelefoon", cat: "accessoire", name: "Koptelefoon", desc: "Gym-playlist aan.", price: 120, icon: "🎧", slot: "hoofd" },
  { id: "acc-kroon", cat: "accessoire", name: "Kroon", desc: "Koning van de gym.", price: 300, icon: "👑", slot: "hoofd" },
  { id: "acc-zonnebril", cat: "accessoire", name: "Zonnebril", desc: "Te cool voor de gym.", price: 80, icon: "🕶️", slot: "ogen" },
  { id: "acc-bril", cat: "accessoire", name: "Ronde bril", desc: "Slim en sterk.", price: 50, icon: "👓", slot: "ogen" },
  { id: "acc-sjaal", cat: "accessoire", name: "Sjaal", desc: "Warm na de training.", price: 40, icon: "🧣", slot: "nek" },
  { id: "acc-ketting", cat: "accessoire", name: "Gouden ketting", desc: "Bling bling.", price: 220, icon: "📿", slot: "nek" },
  { id: "acc-strik", cat: "accessoire", name: "Strikje", desc: "Klaar voor een feestje.", price: 55, icon: "🎀", slot: "nek" },
  { id: "acc-halter", cat: "accessoire", name: "Mini-halter", desc: "Je diertje traint mee.", price: 100, icon: "🏋️", slot: "hand" },
  { id: "acc-shakebeker", cat: "accessoire", name: "Shakebeker", desc: "Altijd een shake bij de hand.", price: 70, icon: "🥛", slot: "hand" },
  // Stijl van het diertje
  ...Object.entries(PET_COLORS)
    .filter(([id]) => id !== "lila")
    .map(([id, c]): ShopItem => ({ id: `kleur-${id}`, cat: "stijl", name: `Kleur: ${c.label}`, desc: "Nieuwe kleur voor je diertje.", price: id === "goud" ? 300 : id === "nacht" ? 200 : 90, icon: "🎨", petColor: id })),
  ...Object.entries(PET_BACKGROUNDS)
    .filter(([id]) => id !== "standaard")
    .map(([id, b]): ShopItem => ({ id: `achtergrond-${id}`, cat: "stijl", name: `Achtergrond: ${b.label}`, desc: "Nieuwe plek voor je diertje.", price: id === "ruimte" ? 250 : 150, icon: "🖼️", petBackground: id })),
  // Profiel (zichtbaar in het klassement)
  { id: "ring-neon", cat: "profiel", name: "Neonring", desc: "Roze-blauwe gloed rond je avatar.", price: 250, icon: "💫", cosmetic: { kind: "frame", value: "neon" } },
  { id: "ring-vuur", cat: "profiel", name: "Vuurring", desc: "Oranje gloed rond je avatar.", price: 300, icon: "🔥", cosmetic: { kind: "frame", value: "vuur" } },
  { id: "ring-smaragd", cat: "profiel", name: "Smaragdring", desc: "Groene gloed rond je avatar.", price: 300, icon: "💚", cosmetic: { kind: "frame", value: "smaragd" } },
  { id: "ring-galaxy", cat: "profiel", name: "Galaxyring", desc: "Paars-blauwe kleurenring met gloed.", price: 600, icon: "🌌", cosmetic: { kind: "frame", value: "galaxy" } },
  { id: "kleur-oceaan", cat: "profiel", name: "Accent: Oceaan", desc: "Knoppen en grafieken in oceaanblauw.", price: 150, icon: "🌊", cosmetic: { kind: "accent", value: "oceaan" } },
  { id: "kleur-citroen", cat: "profiel", name: "Accent: Citroen", desc: "Fris geel accent.", price: 150, icon: "🍋", cosmetic: { kind: "accent", value: "citroen" } },
  { id: "kleur-magenta", cat: "profiel", name: "Accent: Magenta", desc: "Fel roze-paars accent.", price: 150, icon: "💜", cosmetic: { kind: "accent", value: "magenta" } },
  { id: "titel-gymrat", cat: "profiel", name: "Titel: Gymrat", desc: "Titel onder je naam in het klassement.", price: 100, icon: "🏷️", cosmetic: { kind: "title", value: "Gymrat" } },
  { id: "titel-eiwitprof", cat: "profiel", name: "Titel: Eiwitprof", desc: "Titel in het klassement.", price: 100, icon: "🏷️", cosmetic: { kind: "title", value: "Eiwitprof" } },
  { id: "titel-ijzervreter", cat: "profiel", name: "Titel: IJzervreter", desc: "Titel in het klassement.", price: 150, icon: "🏷️", cosmetic: { kind: "title", value: "IJzervreter" } },
  { id: "titel-dierenvriend", cat: "profiel", name: "Titel: Dierenvriend", desc: "Voor wie goed voor zijn diertje zorgt.", price: 120, icon: "🏷️", cosmetic: { kind: "title", value: "Dierenvriend" } },
  { id: "confetti-hartjes", cat: "profiel", name: "Roze confetti", desc: "Roze en rode confetti bij elke viering.", price: 120, icon: "💖", cosmetic: { kind: "confetti", value: "hartjes" } },
  { id: "confetti-neon", cat: "profiel", name: "Neonconfetti", desc: "Felle neonkleuren bij elke viering.", price: 160, icon: "✨", cosmetic: { kind: "confetti", value: "neon" } },
];

export const shopItem = (id: string) => SHOP.find((i) => i.id === id);
/** Permanente items (accessoires, stijl, profiel) koop je één keer; eten en verzorging telkens opnieuw. */
export const isConsumable = (i: ShopItem) => i.cat === "eten" || i.cat === "verzorging";

export const CONFETTI_COLORS: Record<string, string[]> = {
  gold: ["#E8C462", "#F5E3A1", "#C9A227", "#FFFFFF"],
  rainbow: ["#E8C462", "#F28AB2", "#8FD3FF", "#7FD6A4", "#FF7A59", "#C9C2E3"],
  hartjes: ["#F28AB2", "#FF5C8A", "#FFC2D6", "#E0315F"],
  neon: ["#39FF14", "#FF2BD6", "#00E5FF", "#FFF200"],
};
