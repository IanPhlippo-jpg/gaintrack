import * as React from "react";
import { Droplets, Plus, Search, Star, Trash2, ChevronRight, Minus } from "lucide-react";
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
import { allFoods, dayNutrition } from "@/lib/stats";
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
    <div>
      <PageHeader title="Voeding" subtitle={fmtDay(day)} />
      <Section>
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
                <span className="font-bold text-foreground">{(water / 1000).toFixed(2)}</span> / {(g.waterMl / 1000).toFixed(1)} l
              </p>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart-4 transition-[width] duration-700" style={{ width: `${Math.min(100, (water / g.waterMl) * 100)}%` }} />
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => state.addWater(day, -250)} aria-label="250 ml minder">
              <Minus className="size-4" />
            </Button>
            <Button size="sm" onClick={() => state.addWater(day, 250)}>
              +250
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
  const foods = allFoods(state);

  React.useEffect(() => {
    if (!meal) {
      setQ("");
      setSelected(null);
      setCreating(false);
    }
  }, [meal]);

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
    const query = q.trim().toLowerCase();
    if (query) base = base.filter((f) => f.name.toLowerCase().includes(query));
    return base.slice(0, 80);
  }, [foods, tab, q, recentIds, state.favoriteFoodIds]);

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
    <Drawer open={!!meal} onOpenChange={(o) => !o && onClose()} title={selected ? selected.name : creating ? "Nieuw voedingsmiddel" : `Toevoegen aan ${mealLabel}`} description={selected ? `${selected.kcal} kcal · E ${selected.protein} · K ${selected.carbs} · V ${selected.fat} per 100 g` : undefined} full>
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
      ) : creating ? (
        <CustomFoodForm
          onDone={(f) => {
            setCreating(false);
            pick(f);
          }}
          onCancel={() => setCreating(false)}
        />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek voedingsmiddel…" className="pl-10" autoFocus />
          </div>
          <div className="flex items-center justify-between gap-2">
            <AnimatedTabs<PickerTab>
              variant="pill"
              activeTab={tab}
              onChange={setTab}
              tabs={[
                { id: "alles", label: "Alles" },
                { id: "favoriet", label: "★" },
                { id: "recent", label: "Recent" },
                { id: "eigen", label: "Eigen" },
              ]}
              className="text-xs"
            />
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" /> Nieuw
            </Button>
          </div>
          {list.length === 0 ? (
            <EmptyState icon="🔍" title="Niets gevonden" desc="Maak het zelf aan met 'Nieuw'." />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border">
              {list.map((f) => {
                const fav = state.favoriteFoodIds.includes(f.id);
                return (
                  <li key={f.id} className="flex items-center gap-2 bg-card">
                    <button type="button" onClick={() => pick(f)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left active:bg-accent/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{f.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.portionLabel ?? `${f.portion} g`} · {round((f.kcal * f.portion) / 100)} kcal · E {round((f.protein * f.portion) / 100)} g
                        </p>
                      </div>
                    </button>
                    <button type="button" onClick={() => state.toggleFavorite(f.id)} aria-label="Favoriet" className="p-3 text-muted-foreground">
                      <Star className={cn("size-4", fav && "fill-chart-2 text-chart-2")} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Drawer>
  );
}

function CustomFoodForm({ onDone, onCancel }: { onDone: (f: Food) => void; onCancel: () => void }) {
  const addCustomFood = useStore((s) => s.addCustomFood);
  const [name, setName] = React.useState("");
  const [vals, setVals] = React.useState({ kcal: 0, protein: 0, carbs: 0, fat: 0, portion: 100 });
  const valid = name.trim().length > 1 && vals.kcal > 0;
  return (
    <div className="space-y-4">
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
        <Button size="lg" className="flex-1" disabled={!valid} onClick={() => onDone(addCustomFood({ name: name.trim(), ...vals }))}>
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
