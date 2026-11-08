import * as React from "react";
import type { Food } from "@/store/types";

/**
 * Supermarktproducten in België en Nederland uit Open Food Facts (open data, ODbL), geïmporteerd met
 * scripts/import-off.py: de meest gescande producten met volledige voedingswaarden.
 * Compact formaat: n = naam · merk, k/p/c/f per 100 g, q = portie (g), l = portielabel, b = barcode, a = aliassen.
 *
 * De lijst is groot (duizenden producten) en zit daarom in een apart bestand dat pas geladen wordt als de app
 * rustig is of als je zoekt. Gelogde maaltijden bewaren hun eigen voedingswaarden en hebben de lijst niet nodig.
 */
type Row = { id: string; n: string; k: number; p: number; c: number; f: number; q: number; b: string; l?: string; a?: string[] };

let cache: Food[] | null = null;
let loading: Promise<Food[]> | null = null;
const listeners = new Set<() => void>();
const EMPTY: Food[] = [];

export const offFoods = () => cache ?? EMPTY;

export function loadOffFoods(): Promise<Food[]> {
  if (cache) return Promise.resolve(cache);
  loading ??= import("./foods-off.json").then((m) => {
    cache = (m.default as Row[]).map((r) => ({ id: r.id, name: r.n, kcal: r.k, protein: r.p, carbs: r.c, fat: r.f, portion: r.q, portionLabel: r.l, barcode: r.b, aliases: r.a }));
    listeners.forEach((l) => l());
    return cache;
  });
  return loading;
}

/** De supermarktproducten; start het laden en hertekent zodra ze er zijn. */
export function useOffFoods() {
  const list = React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    offFoods,
  );
  React.useEffect(() => {
    void loadOffFoods();
  }, []);
  return list;
}
