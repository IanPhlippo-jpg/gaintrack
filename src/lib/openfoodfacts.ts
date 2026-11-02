import type { Food } from "@/store/types";

/** Zoekt een product op via Open Food Facts (gratis, geen sleutel nodig). Waarden per 100 g/ml. */
export async function lookupBarcode(barcode: string): Promise<Omit<Food, "id" | "custom"> | null> {
  const code = barcode.replace(/\D/g, "");
  if (code.length < 6) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_nl,brands,nutriments,serving_quantity,quantity`;
  const res = await fetch(url, { headers: { "User-Agent": "GainTrack/0.1 (ian@eventus-interieur.be)" } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    status?: number;
    product?: {
      product_name?: string;
      product_name_nl?: string;
      brands?: string;
      serving_quantity?: number | string;
      nutriments?: Record<string, number | string | undefined>;
    };
  };
  const p = json.product;
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
  const name = [p.product_name_nl || p.product_name || "Onbekend product", p.brands?.split(",")[0]?.trim()].filter(Boolean).join(" · ");
  const serving = typeof p.serving_quantity === "string" ? parseFloat(p.serving_quantity) : p.serving_quantity;
  const portion = serving && serving > 0 && serving < 2000 ? Math.round(serving) : 100;
  return {
    name,
    kcal: Math.round(kcal),
    protein: Math.round(protein * 10) / 10,
    carbs: Math.round(carbs * 10) / 10,
    fat: Math.round(fat * 10) / 10,
    portion,
    portionLabel: portion !== 100 ? `1 portie (${portion} g)` : undefined,
    barcode: code,
  };
}
