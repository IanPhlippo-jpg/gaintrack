import type { Food } from "@/store/types";

// Geen eigen User-Agent-header: die dwingt in de browser een CORS-preflight af die Open Food Facts niet toestaat.

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_nl?: string;
  brands?: string;
  quantity?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
};

/** Zet een Open Food Facts-product om naar een voedingsmiddel (per 100 g/ml); null als er geen voedingswaarden zijn. */
export function mapProduct(p: OffProduct | undefined, code?: string): Omit<Food, "id" | "custom"> | null {
  if (!p || !p.nutriments) return null;
  const n = p.nutriments;
  const num = (k: string) => {
    const v = n[k];
    const f = typeof v === "string" ? parseFloat(v) : v;
    return Number.isFinite(f) ? (f as number) : 0;
  };
  let kcal = num("energy-kcal_100g");
  if (!kcal && num("energy-kj_100g")) kcal = num("energy-kj_100g") / 4.184;
  if (!kcal && num("energy_100g")) kcal = num("energy_100g") / 4.184;
  const protein = num("proteins_100g");
  const carbs = num("carbohydrates_100g");
  const fat = num("fat_100g");
  if (!kcal && !protein && !carbs && !fat) return null;
  const base = (p.product_name_nl || p.product_name || "").trim();
  if (!base) return null;
  const name = [base, p.brands?.split(",")[0]?.trim()].filter(Boolean).join(" · ");
  const serving = typeof p.serving_quantity === "string" ? parseFloat(p.serving_quantity) : p.serving_quantity;
  const portion = serving && serving > 0 && serving < 2000 ? Math.round(serving) : 100;
  const barcode = (code ?? p.code ?? "").replace(/\D/g, "") || undefined;
  return {
    name,
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    portion,
    portionLabel: portion !== 100 ? `1 portie (${portion} g)` : undefined,
    barcode,
  };
}

const FIELDS = "code,product_name,product_name_nl,brands,nutriments,serving_quantity,quantity";

/** Zoekt een product op via de streepjescode (gratis, geen sleutel nodig). */
export async function lookupBarcode(barcode: string): Promise<Omit<Food, "id" | "custom"> | null> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 6) return null;
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${FIELDS}`);
  if (!res.ok) return null;
  const json = (await res.json()) as { product?: OffProduct };
  return mapProduct(json.product, code);
}

/**
 * Zoekt winkelproducten op naam via de v2-API (de enige met CORS voor web-apps). Die kent geen vrije tekst,
 * dus zoeken we op merk-tag en op categorie-tag en voegen de resultaten samen, populairste eerst.
 */
const SEARCH_COOLDOWN_MS = 7000;
let lastSearchAt = 0;
/** Seconden die je nog moet wachten voor een volgende online zoekopdracht (0 = mag nu). */
export const searchCooldownLeft = () => Math.max(0, Math.ceil((lastSearchAt + SEARCH_COOLDOWN_MS - Date.now()) / 1000));

export async function searchProducts(query: string, signal?: AbortSignal): Promise<Omit<Food, "id" | "custom">[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (searchCooldownLeft() > 0) throw new Error("cooldown");
  lastSearchAt = Date.now();
  const slug = q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const base = `https://world.openfoodfacts.org/api/v2/search?sort_by=unique_scans_n&page_size=12&fields=${FIELDS}`;
  // Open Food Facts laat ~10 zoekopdrachten per minuut toe: eerst op merk, enkel bij geen resultaat op categorie.
  const attempts = [`${base}&brands_tags=${encodeURIComponent(slug)}`, `${base}&categories_tags=en:${encodeURIComponent(slug)}`];
  const seen = new Set<string>();
  const out: Omit<Food, "id" | "custom">[] = [];
  for (const url of attempts) {
    const res = await fetch(url, { signal });
    if (res.status === 429) throw new Error("rate-limit");
    if (!res.ok) continue;
    const json = (await res.json()) as { products?: OffProduct[] };
    for (const p of json.products ?? []) {
      const f = mapProduct(p);
      if (!f || f.kcal <= 0) continue;
      const key = (f.barcode ?? f.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(f);
    }
    if (out.length > 0) break;
  }
  return out.slice(0, 12);
}
