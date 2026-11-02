import * as React from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useStore } from "@/store/useStore";
import { suggestGoals } from "@/lib/calc";
import { levelProgress, levelTitle } from "@/lib/gamification";
import { totalXp } from "@/lib/stats";
import type { Goals, Profile } from "@/store/types";
import { cn } from "@/lib/utils";

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
  const applySuggestion = () => setGoals(suggestGoals(latest, profile.goalType));

  const field = (key: keyof Goals, label: string, unit: string, step: number) => (
    <div key={key} className="rounded-2xl border bg-card p-3">
      <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
      <NumberStepper value={goals[key]} onChange={(v) => setGoals({ [key]: v })} step={step} unit={unit} />
    </div>
  );

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Profiel en doelen" description={`Level ${lp.level} · ${levelTitle(lp.level)} · ${xp.toLocaleString("nl-BE")} XP`}>
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
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Lengte</p>
            <NumberStepper value={profile.heightCm} onChange={(v) => setProfile({ heightCm: v })} min={120} max={230} unit="cm" />
          </div>
          <div className="rounded-2xl border bg-card p-3">
            <p className="mb-1 text-xs font-semibold text-muted-foreground">Trainingen / week</p>
            <NumberStepper value={goals.weeklyWorkouts} onChange={(v) => setGoals({ weeklyWorkouts: v })} min={1} max={14} />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Doel</p>
          <div className="grid grid-cols-3 gap-2">
            {(["cut", "maintain", "bulk"] as Profile["goalType"][]).map((g) => (
              <button key={g} type="button" onClick={() => setProfile({ goalType: g })} className={cn("rounded-xl border px-3 py-2 text-sm font-semibold", profile.goalType === g ? "border-primary bg-primary/10 text-primary" : "bg-card")}>
                {g === "cut" ? "Afvallen" : g === "maintain" ? "Onderhouden" : "Aankomen"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold">Dagdoelen</p>
            <Button variant="ghost" size="sm" onClick={applySuggestion}>
              Bereken op {latest} kg
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {field("kcal", "Calorieën", "kcal", 50)}
            {field("protein", "Eiwit", "g", 5)}
            {field("carbs", "Koolhydraten", "g", 5)}
            {field("fat", "Vet", "g", 5)}
            {field("waterMl", "Water", "ml", 250)}
            {field("targetWeight", "Streefgewicht", "kg", 0.5)}
          </div>
        </div>

        <div className="rounded-2xl border border-destructive/40 p-4">
          <p className="text-sm font-semibold">Alles wissen</p>
          <p className="mb-3 text-xs text-muted-foreground">Verwijdert al je logs, trainingen en XP op dit toestel.</p>
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
