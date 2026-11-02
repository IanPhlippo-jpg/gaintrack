import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Dumbbell, Flame, Target, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useStore } from "@/store/useStore";
import { suggestGoals } from "@/lib/calc";
import type { Goals, Profile } from "@/store/types";
import { cn } from "@/lib/utils";

const GOAL_TYPES: { id: Profile["goalType"]; label: string; desc: string; icon: React.ReactNode }[] = [
  { id: "cut", label: "Afvallen", desc: "Vet verliezen, spier behouden", icon: <TrendingDown className="size-5" /> },
  { id: "maintain", label: "Onderhouden", desc: "Sterker worden op gewicht", icon: <Minus className="size-5" /> },
  { id: "bulk", label: "Aankomen", desc: "Spiermassa opbouwen", icon: <TrendingUp className="size-5" /> },
];

export function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding);
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [weight, setWeight] = React.useState(80);
  const [height, setHeight] = React.useState(180);
  const [goalType, setGoalType] = React.useState<Profile["goalType"]>("maintain");
  const [goals, setGoals] = React.useState<Goals>({ ...suggestGoals(80, "maintain"), waterMl: 2500, targetWeight: 80, weeklyWorkouts: 4 });

  const recalc = (w: number, g: Profile["goalType"]) => {
    const s = suggestGoals(w, g);
    setGoals((prev) => ({ ...prev, ...s, targetWeight: g === "cut" ? Math.round(w - 5) : g === "bulk" ? Math.round(w + 4) : w }));
  };

  const finish = () => complete({ name: name.trim() || "Atleet", heightCm: height, startWeight: weight, goalType }, goals, weight);

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col bg-background px-6 safe-top">
      <div className="flex items-center gap-2 pt-8">
        <div className="grid size-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Dumbbell className="size-5" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">GainTrack</span>
      </div>
      <div className="mt-6 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col pt-8">
          {step === 0 && (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">Elke dag winnen.</h1>
              <p className="mt-2 text-muted-foreground">Voeding, training en gewicht op één plek, met dagelijkse doelen die je streak levend houden.</p>
              <div className="mt-8 space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Hoe mogen we je noemen?</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Je naam" autoComplete="given-name" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Huidig gewicht</label>
                  <NumberStepper value={weight} onChange={(v) => { setWeight(v); recalc(v, goalType); }} step={0.1} min={30} max={300} unit="kg" size="lg" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold">Lengte</label>
                  <NumberStepper value={height} onChange={setHeight} step={1} min={120} max={230} unit="cm" />
                </div>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">Wat is je doel?</h1>
              <p className="mt-2 text-muted-foreground">We stellen je calorieën en macro's hierop af. Je kunt ze altijd aanpassen.</p>
              <div className="mt-8 space-y-3">
                {GOAL_TYPES.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => { setGoalType(g.id); recalc(weight, g.id); }}
                    className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors", goalType === g.id ? "border-primary bg-primary/10" : "bg-card")}
                  >
                    <div className={cn("grid size-11 place-items-center rounded-full", goalType === g.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{g.icon}</div>
                    <div>
                      <p className="font-bold">{g.label}</p>
                      <p className="text-sm text-muted-foreground">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h1 className="text-3xl font-extrabold tracking-tight">Je dagdoelen</h1>
              <p className="mt-2 text-muted-foreground">Dit zijn je startwaarden op basis van {weight} kg. Pas aan waar nodig.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {(
                  [
                    ["kcal", "Calorieën", "kcal", 50],
                    ["protein", "Eiwit", "g", 5],
                    ["carbs", "Koolhydraten", "g", 5],
                    ["fat", "Vet", "g", 5],
                    ["waterMl", "Water", "ml", 250],
                    ["targetWeight", "Streefgewicht", "kg", 0.5],
                  ] as [keyof Goals, string, string, number][]
                ).map(([key, label, unit, step]) => (
                  <div key={key} className="rounded-2xl border bg-card p-3">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
                    <NumberStepper value={goals[key]} onChange={(v) => setGoals((g) => ({ ...g, [key]: v }))} step={step} unit={unit} />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-primary/10 p-3 text-sm">
                <Flame className="size-4 shrink-0 text-primary" />
                <span>Elke dag dat je alle doelen haalt telt voor je streak en levert bonus-XP op.</span>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-3 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-4">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)}>
            Terug
          </Button>
        )}
        {step < 2 ? (
          <Button size="lg" className="flex-1" onClick={() => setStep((s) => s + 1)}>
            Volgende <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button size="lg" className="flex-1" onClick={finish}>
            <Target className="size-4" /> Start GainTrack
          </Button>
        )}
      </div>
    </div>
  );
}
