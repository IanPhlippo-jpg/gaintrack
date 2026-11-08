import * as React from "react";
import { Droplets, Plus, Search, Star, Trash2, ChevronRight, Minus, ScanBarcode, Loader2, Globe, ChefHat, Pencil } from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { lookupBarcode, searchCooldownLeft, searchProducts } from "@/lib/openfoodfacts";
import { RecipeBuilder } from "@/screens/RecipeBuilder";
import { PageHeader, Section, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { NumberStepper } from "@/components/ui/number-stepper";
import { WeeklyDatePicker } from "@/components/ui/weekly-date-picker";
import { MacroTrackerCard } from "@/components/ui/macro-tracker-card";
import AnimatedTabs from "@/components/ui/animated-tabs";
import { useStore } from "@/store/useStore";
import { MEAL_TYPES, type Food, type FoodEntry, type MealType } from "@/store/types";
import { allFoods, dayNutrition, foodSearchText, normText } from "@/lib/stats";
import { loadOffFoods, useOffFoods } from "@/data/foods-off";
import { dayKey, fmtDay, fromKey, lastNDays, todayKey } from "@/lib/date";
import { cn, round } from "@/lib/utils";

type PickerTab = "alles" | "favoriet" | "recent" | "eigen";

export function NutritionScreen() {
  const state = useStore();
  const [day, setDay] = React.useState(todayKey());
  const [pickerMeal, setPickerMeal] = React.useState<MealType | null>(null);
  const [editing, setEditing] = React.useState<FoodEntry | null>(null);
  const n = dayNutrition(state, day);
  const g = state.goals;
  const water = state.water[day] ?? 0;

  const markers = React.useMemo(() => {
    const m: Record<string, "done" | "partial" | "none"> = {};
    for (const d of lastNDays(60)) {
      const dn = dayNutrition(state, d);
      m[d] = dn.kcal === 0 ? "none" : Math.abs(dn.kcal - g.kcal) <= g.kcal * 0.1 && dn.protein >= g.protein ? "done" : "partial";
    }
    return m;
  }, [state, g.kcal, g.protein]);

  const entriesByMeal = (meal: MealType) => n.entries.filter((e) => e.meal === meal);

  return (
    <div className="short:grid short:grid-cols-2 short:items-start short:gap-x-2">
      <PageHeader title="Voeding" subtitle={fmtDay(day)} className="short:col-span-2" />
      <Section className="short:col-span-2">
        <WeeklyDatePicker date={fromKey(day)} setDate={(d) => setDay(dayKey(d))} markers={markers} />
      </Section>

      <Section>
        <MacroTrackerCard
          currentCalories={n.kcal}
          goalCalories={g.kcal}
          macros={[
            { label: "Eiwit", value: n.protein, goal: g.protein, color: "var(--chart-1)" },
            { label: "Koolh.", value: n.carbs, goal: g.carbs, color: "var(--chart-2)" },
            { label: "Vet", value: n.fat, goal: g.fat, color: "var(--chart-3)" },
          ]}
        />
      </Section>

      <Section>
        <Card className="flex items-center gap-3 p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-chart-4/15 text-chart-4">
            <Droplets className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between">
              <p className="font-bold">Water</p>
              <p className="text-sm tabular-nums text-muted-foreground">
                <span className="font-bold text-foreground">{(water / 1000).toLocaleString("nl-BE", { maximumFractionDigits: 2 })}</span> / {(g.waterMl / 1000).toLocaleString("nl-BE", { maximumFractionDigits: 2 })} l
              </p>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-4 transition-[width] duration-700" style={{ width: `${Math.min(100, (water / g.waterMl) * 100)}%` }} />
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => state.addWater(day, -250)} aria-label="Kwart liter minder">
              <Minus className="size-4" />
            </Button>
            <Button size="sm" onClick={() => state.addWater(day, 250)}>
              +0,25 l
            </Button>
          </div>
        </Card>
      </Section>

      {MEAL_TYPES.map((meal) => {
        const entries = entriesByMeal(meal.id);
        const kcal = entries.reduce((a, e) => a + e.kcal, 0);
        return (
          <Section key={meal.id} className="pb-3">
            <Card>
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meal.emoji}</span>
                  <div>
                    <p className="font-bold leading-tight">{meal.label}</p>
                    <p className="text-xs text-muted-foreground">{entries.length ? `${Math.round(kcal)} kcal · ${round(entries.reduce((a, e) => a + e.protein, 0))} g eiwit` : "Nog niets gelogd"}</p>
                  </div>
                </div>
                <Button size="icon-sm" onClick={() => setPickerMeal(meal.id)} aria-label={`Toevoegen aan ${meal.label}`}>
                  <Plus className="size-4" />
                </Button>
              </div>
              {entries.length > 0 && (
                <ul className="divide-y divide-border border-t">
                  {entries.map((e) => (
                    <li key={e.id}>
                      <button type="button" onClick={() => setEditing(e)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-accent/50">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{e.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.grams} g · E {e.protein} · K {e.carbs} · V {e.fat}
                          </p>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{e.kcal}</span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </Section>
        );
      })}

      <FoodPicker meal={pickerMeal} day={day} onClose={() => setPickerMeal(null)} />
      <EntryEditor entry={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function FoodPicker({ meal, day, onClose }: { meal: MealType | null; day: string; onClose: () => void }) {
  const state = useStore();
  const [q, setQ] = React.useState("");
  const [tab, setTab] = React.useState<PickerTab>("alles");
  const [selected, setSelected] = React.useState<Food | null>(null);
  const [grams, setGrams] = React.useState(100);
  const [creating, setCreating] = React.useState(false);
  const [recipe, setRecipe] = React.useState<false | "new" | Food>(false);
  const [scanning, setScanning] = React.useState(false);
  const [lookup, setLookup] = React.useState<{ code: string; status: "busy" | "notfound" } | null>(null);
  const [online, setOnline] = React.useState<{ q: string; status: "busy" | "done" | "error" | "cooldown"; results: Omit<Food, "id" | "custom">[]; wait?: number } | null>(null);
  const off = useOffFoods();
  const foods = React.useMemo(() => allFoods(state), [state.customFoods, off]); // eslint-disable-line react-hooks/exhaustive-deps

  const searchOnline = React.useCallback(async (query: string) => {
    const wait = searchCooldownLeft();
    if (wait > 0) {
      setOnline({ q: query, status: "cooldown", results: [], wait });
      return;
    }
    setOnline({ q: query, status: "busy", results: [] });
    try {
      const results = await searchProducts(query);
      setOnline({ q: query, status: "done", results });
    } catch {
      setOnline({ q: query, status: "error", results: [] });
    }
  }, []);

  React.useEffect(() => {
    if (!meal) {
      setQ("");
      setSelected(null);
      setCreating(false);
      setRecipe(false);
      setScanning(false);
      setLookup(null);
      setOnline(null);
    }
  }, [meal]);

  const onBarcode = React.useCallback(
    async (code: string) => {
      setScanning(false);
      await loadOffFoods();
      const known = allFoods(useStore.getState()).find((f) => f.barcode === code);
      if (known) {
        setSelected(known);
        setGrams(known.portion);
        return;
      }
      setLookup({ code, status: "busy" });
      try {
        const found = await lookupBarcode(code);
        if (found) {
          const f = useStore.getState().addCustomFood(found);
          setLookup(null);
          setSelected(f);
          setGrams(f.portion);
        } else setLookup({ code, status: "notfound" });
      } catch {
        setLookup({ code, status: "notfound" });
      }
    },
    [],
  );

  const recentIds = React.useMemo(() => {
    const ids: string[] = [];
    for (let i = state.foodLog.length - 1; i >= 0 && ids.length < 15; i--) {
      const id = state.foodLog[i].foodId;
      if (!ids.includes(id)) ids.push(id);
    }
    return ids;
  }, [state.foodLog]);

  const list = React.useMemo(() => {
    let base = foods;
    if (tab === "favoriet") base = foods.filter((f) => state.favoriteFoodIds.includes(f.id));
    if (tab === "recent") base = recentIds.map((id) => foods.find((f) => f.id === id)).filter((f): f is Food => !!f);
    if (tab === "eigen") base = foods.filter((f) => f.custom);
    const words = normText(q).split(/\s+/).filter(Boolean);
    if (words.length) base = base.filter((f) => { const n = foodSearchText(f); return words.every((w) => n.includes(w)); });
    return base.slice(0, 80);
  }, [foods, tab, q, recentIds, state.favoriteFoodIds]);

  // Niets in de bibliotheek? Dan na een korte pauze automatisch online zoeken (één verzoek, met cooldown).
  React.useEffect(() => {
    const query = q.trim();
    if (tab !== "alles" || query.length < 3 || list.length > 0) return;
    if (online && online.q === query) return;
    const t = setTimeout(() => { void searchOnline(query); }, 700);
    return () => clearTimeout(t);
  }, [q, tab, list.length, online, searchOnline]);

  const pick = (f: Food) => {
    setSelected(f);
    setGrams(f.portion);
  };
  const add = () => {
    if (!meal || !selected) return;
    state.logFood(day, meal, selected, grams);
    onClose();
  };

  const mealLabel = MEAL_TYPES.find((m) => m.id === meal)?.label ?? "";

  return (
    <Drawer open={!!meal} onOpenChange={(o) => !o && onClose()} title={selected ? selected.name : creating ? "Nieuw voedingsmiddel" : recipe ? (recipe === "new" ? "Nieuw gerecht" : "Gerecht bewerken") : `Toevoegen aan ${mealLabel}`} description={selected ? `${selected.kcal} kcal · E ${selected.protein} · K ${selected.carbs} · V ${selected.fat} per 100 g` : undefined} full>
      {selected ? (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold">Hoeveelheid</p>
            <NumberStepper value={grams} onChange={setGrams} step={5} min={1} max={5000} unit="g" size="lg" />
            <div className="mt-2 flex flex-wrap gap-2">
              {[{ l: selected.portionLabel ?? `${selected.portion} g`, v: selected.portion }, { l: "50 g", v: 50 }, { l: "100 g", v: 100 }, { l: "150 g", v: 150 }, { l: "200 g", v: 200 }].map((p) => (
                <button key={p.l} type="button" onClick={() => setGrams(p.v)} className={cn("rounded-full border px-3 py-1 text-xs font-semibold", grams === p.v ? "border-primary bg-primary/10 text-primary" : "bg-card")}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              ["kcal", round((selected.kcal * grams) / 100)],
              ["Eiwit", round((selected.protein * grams) / 100, 1)],
              ["Koolh.", round((selected.carbs * grams) / 100, 1)],
              ["Vet", round((selected.fat * grams) / 100, 1)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-muted p-3">
                <p className="text-lg font-bold tabular-nums">{v}</p>
                <p className="text-[11px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="lg" onClick={() => setSelected(null)}>
              Terug
            </Button>
            <Button size="lg" className="flex-1" onClick={add}>
              Toevoegen (+10 XP)
            </Button>
          </div>
        </div>
      ) : recipe ? (
        <RecipeBuilder
          initial={recipe === "new" ? undefined : recipe}
          onDone={(f) => { setRecipe(false); pick(f); }}
          onCancel={() => setRecipe(false)}
        />
      ) : creating ? (
        <CustomFoodForm
          barcode={lookup?.code}
          onDone={(f) => {
            setCreating(false);
            setLookup(null);
            pick(f);
          }}
          onCancel={() => { setCreating(false); setLookup(null); }}
        />
      ) : lookup ? (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          {lookup.status === "busy" ? (
            <>
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="font-semibold">Product opzoeken…</p>
              <p className="text-xs text-muted-foreground">Barcode {lookup.code}</p>
            </>
          ) : (
            <>
              <ScanBarcode className="size-10 text-muted-foreground" />
              <p className="font-semibold">Product niet gevonden</p>
              <p className="text-sm text-muted-foreground">Barcode {lookup.code} staat nog niet in Open Food Facts. Voeg het zelf toe, dan herkent de app het voortaan.</p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setLookup(null)}>
                  Terug
                </Button>
                <Button onClick={() => setCreating(true)}>
                  <Plus className="size-4" /> Zelf toevoegen
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek voedingsmiddel…" className="pl-10" />
            </div>
            <Button className="h-12 shrink-0 px-3" onClick={() => setScanning(true)} aria-label="Barcode scannen">
              <ScanBarcode className="size-5" />
            </Button>
            <Button variant="outline" className="h-12 shrink-0 px-3" onClick={() => setRecipe("new")} aria-label="Nieuw gerecht samenstellen">
              <ChefHat className="size-5" />
            </Button>
            <Button variant="outline" className="h-12 shrink-0 px-3" onClick={() => setCreating(true)} aria-label="Nieuw voedingsmiddel">
              <Plus className="size-5" />
            </Button>
          </div>
          <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onDetected={onBarcode} />
          <AnimatedTabs<PickerTab>
            variant="segment"
            activeTab={tab}
            onChange={setTab}
            tabs={[
              { id: "alles", label: "Alles" },
              { id: "favoriet", label: "★ Favoriet" },
              { id: "recent", label: "Recent" },
              { id: "eigen", label: "Eigen" },
            ]}
            className="text-xs [&_button]:px-2"
          />
          {list.length === 0 && !online ? (
            <EmptyState icon="🔍" title="Niets gevonden in de bibliotheek" desc="Zoek het product online (winkelproducten) of maak het zelf aan met +." />
          ) : list.length === 0 ? null : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border">
              {list.map((f) => {
                const fav = state.favoriteFoodIds.includes(f.id);
                return (
                  <li key={f.id} className="flex items-center gap-2 bg-card">
                    <button type="button" onClick={() => pick(f)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-accent/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.recipe && <ChefHat className="mr-1 inline size-3.5 text-primary" />}{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.portionLabel ?? `${f.portion} g`} · {round((f.kcal * f.portion) / 100)} kcal · E {round((f.protein * f.portion) / 100)} g
                          {f.recipe && ` · ${f.recipe.ingredients.length} ingrediënten`}
                        </p>
                      </div>
                    </button>
                    {f.recipe && (
                      <button type="button" onClick={() => setRecipe(f)} aria-label="Gerecht bewerken" className="p-2 text-muted-foreground">
                        <Pencil className="size-4" />
                      </button>
                    )}
                    <button type="button" onClick={() => state.toggleFavorite(f.id)} aria-label="Favoriet" className="p-3 text-muted-foreground">
                      <Star className={cn("size-4", fav && "fill-chart-2 text-chart-2")} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {q.trim().length >= 2 && tab === "alles" && (
            <div className="space-y-2">
              {(!online || online.q !== q.trim() || online.status === "cooldown" || online.status === "error") && (
                <Button variant="outline" className="w-full" onClick={() => void searchOnline(q.trim())}>
                  <Globe className="size-4" /> Zoek “{q.trim()}” online (winkelproducten)
                </Button>
              )}
              {online && online.q === q.trim() && online.status === "busy" && (
                <p className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Zoeken bij Open Food Facts…</p>
              )}
              {online && online.q === q.trim() && online.status === "error" && <p className="text-center text-xs text-destructive">Online zoeken lukte niet: geen verbinding, of te veel zoekopdrachten na elkaar. Probeer over een paar seconden opnieuw.</p>}
              {online && online.q === q.trim() && online.status === "cooldown" && (
                <p className="text-center text-xs text-muted-foreground">Even wachten: Open Food Facts laat één zoekopdracht per paar seconden toe. Probeer over {online.wait} s opnieuw.</p>
              )}
              {online && online.q === q.trim() && online.status === "done" && (
                online.results.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground">Niets gevonden online. Maak het zelf aan met +.</p>
                ) : (
                  <>
                    <p className="pt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Online gevonden · per 100 g</p>
                    <ul className="divide-y divide-border overflow-hidden rounded-2xl border">
                      {online.results.map((r, i) => (
                        <li key={`${r.barcode ?? r.name}-${i}`}>
                          <button type="button" onClick={() => pick(state.addCustomFood(r))} className="flex w-full items-center gap-3 bg-card px-4 py-3 text-left active:bg-accent/50">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{r.name}</p>
                              <p className="text-xs text-muted-foreground">{r.kcal} kcal · E {r.protein} · K {r.carbs} · V {r.fat}</p>
                            </div>
                            <Plus className="size-4 shrink-0 text-muted-foreground" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="text-center text-[11px] text-muted-foreground">Gekozen producten worden bewaard onder Eigen, dus volgende keer werkt het ook offline.</p>
                  </>
                )
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

function CustomFoodForm({ onDone, onCancel, barcode }: { onDone: (f: Food) => void; onCancel: () => void; barcode?: string }) {
  const addCustomFood = useStore((s) => s.addCustomFood);
  const [name, setName] = React.useState("");
  const [vals, setVals] = React.useState({ kcal: 0, protein: 0, carbs: 0, fat: 0, portion: 100 });
  const valid = name.trim().length > 1 && vals.kcal > 0;
  return (
    <div className="space-y-4">
      {barcode && (
        <p className="flex items-center gap-2 rounded-2xl bg-muted p-3 text-xs text-muted-foreground">
          <ScanBarcode className="size-4" /> Wordt gekoppeld aan barcode {barcode}
        </p>
      )}
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Naam</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="bv. Eiwitshake aardbei" autoFocus />
      </div>
      <p className="text-xs text-muted-foreground">Waarden per 100 g (of 100 ml)</p>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["kcal", "Calorieën", "kcal", 5],
            ["protein", "Eiwit", "g", 0.5],
            ["carbs", "Koolhydraten", "g", 0.5],
            ["fat", "Vet", "g", 0.5],
            ["portion", "Standaardportie", "g", 5],
          ] as [keyof typeof vals, string, string, number][]
        ).map(([k, l, u, s]) => (
          <div key={k} className="rounded-2xl border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">{l}</p>
            <NumberStepper value={vals[k]} onChange={(v) => setVals((x) => ({ ...x, [k]: v }))} step={s} unit={u} />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Annuleer
        </Button>
        <Button size="lg" className="flex-1" disabled={!valid} onClick={() => onDone(addCustomFood({ name: name.trim(), ...vals, barcode }))}>
          Opslaan en kiezen
        </Button>
      </div>
    </div>
  );
}

function EntryEditor({ entry, onClose }: { entry: FoodEntry | null; onClose: () => void }) {
  const update = useStore((s) => s.updateFoodEntry);
  const remove = useStore((s) => s.removeFoodEntry);
  const [grams, setGrams] = React.useState(100);
  React.useEffect(() => {
    if (entry) setGrams(entry.grams);
  }, [entry]);
  if (!entry) return <Drawer open={false} onOpenChange={() => {}}>{null}</Drawer>;
  const k = grams / entry.grams;
  return (
    <Drawer open={!!entry} onOpenChange={(o) => !o && onClose()} title={entry.name} description={`${round(entry.kcal * k)} kcal · E ${round(entry.protein * k, 1)} · K ${round(entry.carbs * k, 1)} · V ${round(entry.fat * k, 1)}`}>
      <div className="space-y-4">
        <NumberStepper value={grams} onChange={setGrams} step={5} min={1} max={5000} unit="g" size="lg" />
        <div className="flex gap-2">
          <Button variant="destructive" size="lg" onClick={() => { remove(entry.id); onClose(); }} aria-label="Verwijderen">
            <Trash2 className="size-4" />
          </Button>
          <Button size="lg" className="flex-1" onClick={() => { update(entry.id, grams); onClose(); }}>
            Opslaan
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
