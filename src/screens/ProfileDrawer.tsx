import * as React from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useStore } from "@/store/useStore";
import { computeGoals } from "@/lib/calc";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { totalXp } from "@/lib/stats";
import type { Activity, Goals, Profile } from "@/store/types";
import { cn, fmtKg } from "@/lib/utils";

const ACTIVITIES: { v: Activity; l: string }[] = [
  { v: "zittend", l: "Zittend" },
  { v: "licht", l: "Licht actief" },
  { v: "matig", l: "Matig actief" },
  { v: "actief", l: "Actief" },
  { v: "zeer", l: "Zeer actief" },
];

function Segment<T extends string>({ options, value, onChange }: { options: { v: T; l: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className={cn("grid gap-2", options.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className={cn("rounded-xl border px-3 py-2 text-sm font-semibold", value === o.v ? "border-primary bg-primary/10 text-primary" : "bg-card")}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function ProfileDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const profile = useStore((s) => s.profile);
  const goals = useStore((s) => s.goals);
  const weights = useStore((s) => s.weights);
  const setProfile = useStore((s) => s.setProfile);
  const setGoals = useStore((s) => s.setGoals);
  const resetAll = useStore((s) => s.resetAll);
  const xp = useStore((s) => totalXp(s));
  const lp = levelProgress(xp);
  const [confirmReset, setConfirmReset] = React.useState(false);

  const latest = weights[weights.length - 1]?.kg ?? profile.startWeight;
  const applySuggestion = () => {
    const g = computeGoals(profile, latest);
    setGoals({ kcal: g.kcal, protein: g.protein, carbs: g.carbs, fat: g.fat, waterMl: g.waterMl });
  };

  const field = (key: keyof Goals, label: string, unit: string, step: number) => {
    const isWater = key === "waterMl";
    return (
      <div key={key} className="rounded-2xl border bg-card p-3">
        <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
        <NumberStepper value={isWater ? goals.waterMl / 1000 : goals[key]} onChange={(v) => setGoals({ [key]: isWater ? Math.round(v * 1000) : v })} step={step} unit={unit} />
      </div>
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Profiel en doelen" description={`Level ${lp.level} · ${levelTitle(lp.level)} · ${xp.toLocaleString("nl-BE")} XP`} full>
      <div className="space-y-5">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${lp.pct}%` }} />
        </div>
        <p className="-mt-3 text-xs text-muted-foreground">
          {lp.current.toLocaleString("nl-BE")} / {lp.needed.toLocaleString("nl-BE")} XP tot level {lp.level + 1}
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-semibold">Naam</label>
          <Input value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Geslacht</p>
          <Segment<Profile["gender"]> options={[{ v: "man", l: "Man" }, { v: "vrouw", l: "Vrouw" }, { v: "anders", l: "Anders" }]} value={profile.gender} onChange={(v) => setProfile({ gender: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Leeftijd</p>
            <NumberStepper value={profile.age} onChange={(v) => setProfile({ age: v })} min={12} max={100} unit="jaar" />
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Lengte</p>
            <NumberStepper value={profile.heightCm} onChange={(v) => setProfile({ heightCm: v })} min={120} max={230} unit="cm" />
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Trainingen per week</p>
            <NumberStepper value={goals.weeklyWorkouts} onChange={(v) => { setGoals({ weeklyWorkouts: v }); setProfile({ daysPerWeek: v }); }} min={1} max={14} unit="dagen" />
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Activiteit overdag</p>
            <select value={profile.activity} onChange={(e) => setProfile({ activity: e.target.value as Activity })} className="h-10 w-full rounded-xl border border-input bg-background/60 px-2 text-sm font-semibold">
              {ACTIVITIES.map((a) => (
                <option key={a.v} value={a.v}>
                  {a.l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Doel</p>
          <Segment<Profile["goalType"]> options={[{ v: "cut", l: "Afvallen" }, { v: "maintain", l: "Onderhouden" }, { v: "bulk", l: "Aankomen" }]} value={profile.goalType} onChange={(v) => setProfile({ goalType: v })} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Ervaring</p>
          <Segment<Profile["experience"]> options={[{ v: "beginner", l: "Beginner" }, { v: "gevorderd", l: "Gevorderd" }, { v: "ervaren", l: "Ervaren" }]} value={profile.experience} onChange={(v) => setProfile({ experience: v })} />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold">Dagdoelen</p>
            <Button variant="ghost" size="sm" onClick={applySuggestion}>
              Herbereken op {fmtKg(latest)}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("kcal", "Calorieën", "kcal", 50)}
            {field("protein", "Eiwit", "g", 5)}
            {field("carbs", "Koolhydraten", "g", 5)}
            {field("fat", "Vet", "g", 5)}
            {field("waterMl", "Water", "l", 0.25)}
            {field("targetWeight", "Streefgewicht", "kg", 0.5)}
          </div>
        </div>

        <div className="rounded-2xl border border-destructive/40 p-4">
          <p className="text-sm font-semibold">Alles wissen</p>
          <p className="mb-3 text-xs text-muted-foreground">Verwijdert al je logs, trainingen en XP op dit toestel en start de quiz opnieuw.</p>
          {confirmReset ? (
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={() => { resetAll(); onOpenChange(false); setConfirmReset(false); }}>
                Ja, wis alles
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmReset(false)}>
                Annuleer
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmReset(true)}>
              Gegevens wissen
            </Button>
          )}
        </div>
      </div>
    </Drawer>
  );
}
