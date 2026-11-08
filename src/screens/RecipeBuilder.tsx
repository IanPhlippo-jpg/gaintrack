/**
 * Gerecht samenstellen uit ingrediënten: per ingrediënt de hoeveelheid in gram, aantal porties,
 * en de app telt alles op. Het gerecht wordt bewaard als eigen voedingsmiddel (waarden per 100 g),
 * zodat je het nadien per portie of per gram kunt loggen.
 */
import * as React from "react";
import { ChefHat, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useStore } from "@/store/useStore";
import type { Food, RecipeIngredient } from "@/store/types";
import { allFoods } from "@/lib/stats";
import { useOffFoods } from "@/data/foods-off";
import { cn, round } from "@/lib/utils";

const norm = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

type Line = RecipeIngredient & { food: Food };

export function recipeTotals(lines: { food: Pick<Food, "kcal" | "protein" | "carbs" | "fat">; grams: number }[]) {
  return lines.reduce(
    (a, l) => ({
      grams: a.grams + l.grams,
      kcal: a.kcal + (l.food.kcal * l.grams) / 100,
      protein: a.protein + (l.food.protein * l.grams) / 100,
      carbs: a.carbs + (l.food.carbs * l.grams) / 100,
      fat: a.fat + (l.food.fat * l.grams) / 100,
    }),
    { grams: 0, kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function RecipeBuilder({ onDone, onCancel, initial }: { onDone: (f: Food) => void; onCancel: () => void; initial?: Food }) {
  const state = useStore();
  const off = useOffFoods();
  const foods = React.useMemo(() => allFoods(state).filter((f) => !f.recipe || f.id === initial?.id ? !f.recipe : false), [state, initial?.id, off]);
  const [name, setName] = React.useState(initial?.name ?? "");
  const [portions, setPortions] = React.useState(initial?.recipe?.portions ?? 1);
  const [lines, setLines] = React.useState<Line[]>(() =>
    (initial?.recipe?.ingredients ?? [])
      .map((i) => {
        const food = foods.find((f) => f.id === i.foodId);
        return food ? { ...i, food } : null;
      })
      .filter((x): x is Line => !!x),
  );
  const [q, setQ] = React.useState("");

  const matches = React.useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return foods.filter((f) => { const n = norm(`${f.name} ${(f.aliases ?? []).join(" ")}`); return words.every((w) => n.includes(w)); }).slice(0, 8);
  }, [q, foods]);

  const add = (food: Food) => {
    setLines((ls) => [...ls, { foodId: food.id, name: food.name, grams: food.portion, food }]);
    setQ("");
  };
  const setGrams = (i: number, grams: number) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, grams } : l)));
  const remove = (i: number) => setLines((ls) => ls.filter((_, j) => j !== i));

  const total = recipeTotals(lines);
  const perPortion = { kcal: total.kcal / portions, protein: total.protein / portions, carbs: total.carbs / portions, fat: total.fat / portions, grams: total.grams / portions };
  const valid = name.trim().length > 1 && lines.length > 0 && total.grams > 0;

  const save = () => {
    if (!valid) return;
    const per100 = (v: number) => round((v / total.grams) * 100, 1);
    const payload: Omit<Food, "id" | "custom"> = {
      name: name.trim(),
      kcal: Math.round((total.kcal / total.grams) * 100),
      protein: per100(total.protein),
      carbs: per100(total.carbs),
      fat: per100(total.fat),
      portion: Math.max(1, Math.round(perPortion.grams)),
      portionLabel: portions > 1 ? `1 portie (${Math.round(perPortion.grams)} g, 1/${portions})` : `hele bereiding (${Math.round(total.grams)} g)`,
      recipe: { ingredients: lines.map(({ foodId, name: n, grams }) => ({ foodId, name: n, grams })), portions, totalGrams: Math.round(total.grams) },
    };
    if (initial) {
      state.updateCustomFood(initial.id, payload);
      onDone({ ...initial, ...payload });
    } else {
      onDone(state.addCustomFood(payload));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Naam van het gerecht</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="bv. Kip met rijst en broccoli" autoFocus={!initial} />
      </div>

      <div>
        <p className="mb-1.5 text-sm font-semibold">Ingrediënten</p>
        {lines.length === 0 && <p className="mb-2 rounded-2xl border border-dashed p-3 text-center text-xs text-muted-foreground">Zoek hieronder een ingrediënt en tik erop om het toe te voegen.</p>}
        <div className="space-y-2">
          {lines.map((l, i) => {
            const kcal = Math.round((l.food.kcal * l.grams) / 100);
            return (
              <div key={`${l.foodId}-${i}`} className="rounded-2xl border bg-card p-3">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold">{l.name}</p>
                  <span className="text-xs tabular-nums text-muted-foreground">{kcal} kcal</span>
                  <button type="button" onClick={() => remove(i)} className="p-1 text-destructive" aria-label="Ingrediënt verwijderen">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1">
                    <NumberStepper value={l.grams} onChange={(v) => setGrams(i, v)} step={5} min={1} max={5000} unit="g" />
                  </div>
                  {l.food.portionLabel && (
                    <button type="button" onClick={() => setGrams(i, l.food.portion)} className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                      {l.food.portionLabel}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ingrediënt zoeken…" className="pl-10" />
        </div>
        {matches.length > 0 && (
          <ul className="mt-1 divide-y divide-border overflow-hidden rounded-2xl border">
            {matches.map((f) => (
              <li key={f.id}>
                <button type="button" onClick={() => add(f)} className="flex w-full items-center gap-3 bg-card px-3 py-2.5 text-left active:bg-accent/50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.kcal} kcal · E {f.protein} · K {f.carbs} · V {f.fat} per 100 g</p>
                  </div>
                  <Plus className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {q.trim().length >= 2 && matches.length === 0 && <p className="mt-1 text-xs text-muted-foreground">Niets gevonden. Maak het ingrediënt eerst aan als eigen voedingsmiddel.</p>}
      </div>

      <div className="rounded-2xl border bg-card p-3">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">Aantal porties</p>
        <NumberStepper value={portions} onChange={setPortions} step={1} min={1} max={20} unit={portions === 1 ? "portie" : "porties"} />
      </div>

      <div className={cn("rounded-2xl border p-3", lines.length ? "border-primary/40 bg-primary/10" : "bg-card")}>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 font-semibold"><ChefHat className="size-4 text-primary" /> Totaal</span>
          <span className="text-xs text-muted-foreground">{Math.round(total.grams)} g · {lines.length} {lines.length === 1 ? "ingrediënt" : "ingrediënten"}</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["kcal", Math.round(total.kcal), Math.round(perPortion.kcal)],
            ["Eiwit", round(total.protein, 1), round(perPortion.protein, 1)],
            ["Koolh.", round(total.carbs, 1), round(perPortion.carbs, 1)],
            ["Vet", round(total.fat, 1), round(perPortion.fat, 1)],
          ].map(([l, t, pp]) => (
            <div key={String(l)} className="rounded-xl bg-background/60 p-2">
              <p className="text-base font-bold tabular-nums">{t}</p>
              {portions > 1 && <p className="text-[10px] tabular-nums text-primary">{pp} / portie</p>}
              <p className="text-[10px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Annuleer
        </Button>
        <Button size="lg" className="flex-1" disabled={!valid} onClick={save}>
          {initial ? "Gerecht bijwerken" : "Gerecht bewaren"}
        </Button>
      </div>
    </div>
  );
}
