/**
 * Beloningen die je ontgrendelt met je level. Cosmetische beloningen (ring rond je avatar, accentkleur,
 * titel, confetti) kies je zelf onder Beloningen en zijn zichtbaar in het klassement; voordelen werken vanzelf.
 */
import { levelFromXp, xpForLevel } from "@/lib/gamification";

export type UnlockKind = "frame" | "accent" | "title" | "confetti" | "perk";

export interface Unlock {
  id: string;
  level: number;
  kind: UnlockKind;
  name: string;
  desc: string;
  icon: string;
  /** Waarde voor cosmetische beloningen (frame-id, kleur-id, titeltekst, confetti-id). */
  value?: string;
}

export const UNLOCKS: Unlock[] = [
  { id: "frame-bronze", level: 2, kind: "frame", value: "bronze", name: "Bronzen ring", desc: "Een bronzen ring rond je avatar, ook zichtbaar in het klassement.", icon: "🥉" },
  { id: "accent-goud", level: 3, kind: "accent", value: "goud", name: "Gouden accentkleur", desc: "Knoppen, ringen en grafieken in goud in plaats van lila.", icon: "🎨" },
  { id: "title-doorzetter", level: 4, kind: "title", value: "Doorzetter", name: "Titel: Doorzetter", desc: "Een titel onder je naam in het klassement.", icon: "🏷️" },
  { id: "perk-streak-shield", level: 5, kind: "perk", name: "Streak-schild", desc: "Eén gemiste dag per week breekt je streak niet meer.", icon: "🛡️" },
  { id: "frame-silver", level: 6, kind: "frame", value: "silver", name: "Zilveren ring", desc: "Zilveren ring rond je avatar.", icon: "🥈" },
  { id: "accent-roze", level: 7, kind: "accent", value: "roze", name: "Roze accentkleur", desc: "Zacht roze accent in de hele app.", icon: "🌸" },
  { id: "perk-weekend-xp", level: 8, kind: "perk", name: "Dubbele XP in het weekend", desc: "Alles wat je op zaterdag en zondag logt levert 2× XP op.", icon: "⚡" },
  { id: "title-krachtpatser", level: 9, kind: "title", value: "Krachtpatser", name: "Titel: Krachtpatser", desc: "Titel in het klassement.", icon: "🏷️" },
  { id: "frame-gold", level: 10, kind: "frame", value: "gold", name: "Gouden ring", desc: "Gouden ring met gloed rond je avatar.", icon: "🥇" },
  { id: "accent-groen", level: 11, kind: "accent", value: "groen", name: "Groene accentkleur", desc: "Fris groen accent.", icon: "🌿" },
  { id: "perk-week-bonus", level: 12, kind: "perk", name: "Weekbonus", desc: "+250 XP zodra je 5 perfecte dagen in één week haalt.", icon: "🎁" },
  { id: "confetti-gold", level: 13, kind: "confetti", value: "gold", name: "Gouden confetti", desc: "Gouden confetti bij elke viering.", icon: "🎉" },
  { id: "title-beest", level: 14, kind: "title", value: "Beest", name: "Titel: Beest", desc: "Titel in het klassement.", icon: "🏷️" },
  { id: "frame-diamond", level: 15, kind: "frame", value: "diamond", name: "Diamanten ring", desc: "IJsblauwe diamanten ring met gloed.", icon: "💎" },
  { id: "accent-vuur", level: 17, kind: "accent", value: "vuur", name: "Vuur-accentkleur", desc: "Oranjerood accent.", icon: "🔥" },
  { id: "frame-legend", level: 20, kind: "frame", value: "legend", name: "Legende-ring", desc: "Regenboogring die draait. Alleen voor wie level 20 haalt.", icon: "🌈" },
  { id: "title-legende", level: 20, kind: "title", value: "Legende", name: "Titel: Legende", desc: "De hoogste titel.", icon: "👑" },
  { id: "confetti-rainbow", level: 25, kind: "confetti", value: "rainbow", name: "Regenboogconfetti", desc: "Alle kleuren bij elke viering.", icon: "🎊" },
  { id: "title-onsterfelijk", level: 30, kind: "title", value: "Onsterfelijk", name: "Titel: Onsterfelijk", desc: "Voor de allergrootsten.", icon: "⚜️" },
];

export const ACCENTS: Record<string, { label: string; primary: string; foreground: string }> = {
  goud: { label: "Goud", primary: "#E8C462", foreground: "#1A1405" },
  roze: { label: "Roze", primary: "#F28AB2", foreground: "#2A0E1A" },
  groen: { label: "Groen", primary: "#7FD6A4", foreground: "#06201A" },
  vuur: { label: "Vuur", primary: "#FF7A59", foreground: "#2A0E05" },
};

export const FRAMES: Record<string, { label: string }> = {
  bronze: { label: "Brons" },
  silver: { label: "Zilver" },
  gold: { label: "Goud" },
  diamond: { label: "Diamant" },
  legend: { label: "Legende" },
};

export const isUnlocked = (u: Unlock, level: number) => level >= u.level;
export const unlockedAt = (level: number) => UNLOCKS.filter((u) => u.level <= level);
export const unlocksForLevel = (level: number) => UNLOCKS.filter((u) => u.level === level);
export const nextUnlock = (level: number) => UNLOCKS.find((u) => u.level > level) ?? null;
export const hasPerk = (xp: number, perkId: string) => {
  const u = UNLOCKS.find((x) => x.id === perkId);
  return !!u && levelFromXp(xp) >= u.level;
};
/** XP die nog ontbreekt tot de volgende beloning. */
export const xpToNextUnlock = (xp: number) => {
  const u = nextUnlock(levelFromXp(xp));
  return u ? Math.max(0, xpForLevel(u.level) - xp) : 0;
};
/** Mag deze cosmetische keuze (nog) gebruikt worden op dit level? */
export const cosmeticAllowed = (kind: UnlockKind, value: string | undefined, level: number) =>
  !value || UNLOCKS.some((u) => u.kind === kind && u.value === value && u.level <= level);
