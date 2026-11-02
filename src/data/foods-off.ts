import type { Food } from "@/store/types";
import raw from "./foods-off.json";

/**
 * Populaire supermarktproducten in België en Nederland uit Open Food Facts (open data, ODbL),
 * eenmalig geïmporteerd op 2 november 2026: de meest gescande producten met volledige voedingswaarden.
 * Compact formaat: n = naam · merk, k/p/c/f per 100 g, q = portie (g), l = portielabel, b = barcode, a = aliassen.
 */
type Row = { id: string; n: string; k: number; p: number; c: number; f: number; q: number; b: string; l?: string; a?: string[] };

export const OFF_FOODS: Food[] = (raw as Row[]).map((r) => ({
  id: r.id,
  name: r.n,
  kcal: r.k,
  protein: r.p,
  carbs: r.c,
  fat: r.f,
  portion: r.q,
  portionLabel: r.l,
  barcode: r.b,
  aliases: r.a,
}));
