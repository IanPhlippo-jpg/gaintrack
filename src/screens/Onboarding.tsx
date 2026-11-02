import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Dumbbell, Flame, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberStepper } from "@/components/ui/number-stepper";
import { ExerciseMedia } from "@/components/ui/exercise-media";
import { useStore } from "@/store/useStore";
import { computeGoals } from "@/lib/calc";
import { PROGRAMS, recommendPrograms, type Program } from "@/data/programs";
import { SEED_EXERCISES } from "@/data/exercises";
import type { Activity, Goals, Profile } from "@/store/types";
import { WEEKDAYS_NL } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useAccount } from "@/screens/LockScreen";

type Answers = {
  name: string;
  gender: Profile["gender"];
  age: number;
  heightCm: number;
  weight: number;
  goalType: Profile["goalType"];
  activity: Activity;
  daysPerWeek: number;
  experience: Profile["experience"];
  programId: string;
};

type StepId = "name" | "gender" | "age" | "height" | "weight" | "goal" | "activity" | "days" | "experience" | "program" | "summary";

const STEPS: { id: StepId; question: string; help: string }[] = [
  { id: "name", question: "Hoe mogen we je noemen?", help: "Zo spreken we je aan op je dashboard." },
  { id: "gender", question: "Wat is je geslacht?", help: "Bepaalt je energiebehoefte en welke trainingsprogramma's we voorstellen." },
  { id: "age", question: "Hoe oud ben je?", help: "Je leeftijd telt mee in je ruststofwisseling." },
  { id: "height", question: "Hoe lang ben je?", help: "Nodig voor je BMI en calorieberekening." },
  { id: "weight", question: "Wat weeg je nu?", help: "Dit wordt meteen je eerste meting in de gewichtsgrafiek." },
  { id: "goal", question: "Wat wil je bereiken?", help: "We stellen je calorieën en macro's hierop af." },
  { id: "activity", question: "Hoe actief ben je buiten het sporten?", help: "Werk, stappen en dagelijkse beweging." },
  { id: "days", question: "Hoeveel dagen per week wil je trainen?", help: "Hierop kiezen we een programma dat je volhoudt." },
  { id: "experience", question: "Hoeveel ervaring heb je met krachttraining?", help: "Beginners groeien het snelst met eenvoudige basisschema's." },
  { id: "program", question: "Kies je trainingsprogramma", help: "Op maat van je antwoorden. Je kunt later altijd wisselen of zelf schema's bouwen." },
  { id: "summary", question: "Je dagdoelen", help: "Berekend uit je antwoorden. Pas aan waar je wilt." },
];

const CHOICES = {
  gender: [
    { v: "man", l: "Man", e: "👨" },
    { v: "vrouw", l: "Vrouw", e: "👩" },
    { v: "anders", l: "Anders / zeg ik liever niet", e: "🧑" },
  ],
  goal: [
    { v: "cut", l: "Afvallen", d: "Vet verliezen, spier behouden", e: "🔥" },
    { v: "maintain", l: "Onderhouden", d: "Sterker worden op gewicht", e: "⚖️" },
    { v: "bulk", l: "Aankomen", d: "Spiermassa opbouwen", e: "💪" },
  ],
  activity: [
    { v: "zittend", l: "Zittend", d: "Bureauwerk, weinig stappen", e: "🪑" },
    { v: "licht", l: "Licht actief", d: "Wat wandelen, staand werk", e: "🚶" },
    { v: "matig", l: "Matig actief", d: "Veel in beweging overdag", e: "🏃" },
    { v: "actief", l: "Actief", d: "Fysiek werk of veel sport", e: "⚡" },
    { v: "zeer", l: "Zeer actief", d: "Zwaar fysiek werk én sport", e: "🔥" },
  ],
  experience: [
    { v: "beginner", l: "Beginner", d: "Minder dan 1 jaar", e: "🌱" },
    { v: "gevorderd", l: "Gevorderd", d: "1 tot 3 jaar", e: "🌿" },
    { v: "ervaren", l: "Ervaren", d: "Meer dan 3 jaar", e: "🌳" },
  ],
} as const;

function ChoiceList<T extends string>({ options, value, onChange }: { options: readonly { v: T; l: string; d?: string; e: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="space-y-2.5">
      {options.map((o) => (
        <button key={o.v} type="button" onClick={() => onChange(o.v)} className={cn("flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors active:scale-[0.99]", value === o.v ? "border-primary bg-primary/10" : "bg-card")}>
          <span className={cn("grid size-11 shrink-0 place-items-center rounded-full text-xl", value === o.v ? "bg-primary/20" : "bg-muted")}>{o.e}</span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{o.l}</p>
            {o.d && <p className="text-sm text-muted-foreground">{o.d}</p>}
          </div>
          {value === o.v && <Check className="size-5 text-primary" strokeWidth={3} />}
        </button>
      ))}
    </div>
  );
}

function ProgramCard({ program, selected, onSelect, recommended }: { program: Program; selected: boolean; onSelect: () => void; recommended?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const exerciseIds = Array.from(new Set(program.routines.flatMap((r) => r.exercises.map((e) => e.exerciseId)))).slice(0, 4);
  return (
    <div className={cn("rounded-2xl border bg-card transition-colors", selected && "border-primary bg-primary/10")}>
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-bold">{program.name}</p>
            {recommended && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Aanbevolen</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            {program.days} dagen · {program.level} · {program.focus}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{program.desc}</p>
        </div>
        <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border", selected ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{selected && <Check className="size-4" strokeWidth={3} />}</span>
      </button>
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex -space-x-2">
          {exerciseIds.map((id) => {
            const ex = SEED_EXERCISES.find((e) => e.id === id);
            return ex ? <ExerciseMedia key={id} exercise={ex} size="thumb" showLabels={false} auto={false} className="h-9 w-9 rounded-full ring-2 ring-card" /> : null;
          })}
        </div>
        <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs font-semibold text-primary">
          {open ? "Verberg schema" : "Bekijk schema"}
        </button>
      </div>
      {open && (
        <div className="space-y-2 border-t px-4 py-3">
          {program.routines.map((r) => (
            <div key={r.id} className="text-sm">
              <p className="font-semibold">
                {r.emoji} {r.name} <span className="font-normal text-muted-foreground">· {r.days.map((d) => WEEKDAYS_NL[d]).join(", ")}</span>
              </p>
              <p className="text-xs text-muted-foreground">{r.exercises.map((e) => `${SEED_EXERCISES.find((x) => x.id === e.exerciseId)?.name ?? e.exerciseId} ${e.sets}×${e.reps}`).join(" · ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Onboarding() {
  const complete = useStore((s) => s.completeOnboarding);
  const { account } = useAccount();
  const [step, setStep] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [a, setA] = React.useState<Answers>({ name: account?.name ?? "", gender: "man", age: 30, heightCm: 180, weight: 80, goalType: "maintain", activity: "matig", daysPerWeek: 3, experience: "beginner", programId: "" });
  const [goals, setGoals] = React.useState<Goals | null>(null);
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((x) => ({ ...x, [k]: v }));

  const current = STEPS[step];
  const recommended = React.useMemo(() => recommendPrograms(a.gender, a.daysPerWeek, a.experience), [a.gender, a.daysPerWeek, a.experience]);
  const programId = a.programId || recommended[0]?.id;

  const computed = React.useMemo(() => ({ ...computeGoals(a, a.weight), weeklyWorkouts: a.daysPerWeek }), [a]);
  const effectiveGoals: Goals = goals ?? computed;

  const canNext = current.id !== "name" || true;
  const next = () => {
    setDir(1);
    if (current.id === "program" && !goals) setGoals(computed);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };
  const finish = () => {
    const program = PROGRAMS.find((p) => p.id === programId);
    const profile: Profile = {
      name: a.name.trim() || "Atleet",
      gender: a.gender,
      age: a.age,
      heightCm: a.heightCm,
      startWeight: a.weight,
      goalType: a.goalType,
      activity: a.activity,
      experience: a.experience,
      daysPerWeek: a.daysPerWeek,
      programId,
    };
    complete(profile, effectiveGoals, a.weight, program?.routines);
  };

  const body = () => {
    switch (current.id) {
      case "name":
        return <Input value={a.name} onChange={(e) => set("name", e.target.value)} placeholder="Je voornaam" autoComplete="given-name" className="h-14 text-lg" autoFocus />;
      case "gender":
        return <ChoiceList options={CHOICES.gender} value={a.gender} onChange={(v) => set("gender", v)} />;
      case "age":
        return <NumberStepper value={a.age} onChange={(v) => set("age", v)} min={12} max={100} unit="jaar" size="lg" />;
      case "height":
        return <NumberStepper value={a.heightCm} onChange={(v) => set("heightCm", v)} min={120} max={230} unit="cm" size="lg" />;
      case "weight":
        return <NumberStepper value={a.weight} onChange={(v) => set("weight", v)} step={0.1} min={30} max={300} unit="kg" size="lg" />;
      case "goal":
        return <ChoiceList options={CHOICES.goal} value={a.goalType} onChange={(v) => set("goalType", v)} />;
      case "activity":
        return <ChoiceList options={CHOICES.activity} value={a.activity} onChange={(v) => set("activity", v)} />;
      case "days":
        return (
          <div className="grid grid-cols-5 gap-2">
            {[2, 3, 4, 5, 6].map((d) => (
              <button key={d} type="button" onClick={() => set("daysPerWeek", d)} className={cn("flex flex-col items-center rounded-2xl border py-4 transition-colors", a.daysPerWeek === d ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                <span className="text-2xl font-extrabold">{d}</span>
                <span className={cn("text-[10px] font-semibold uppercase", a.daysPerWeek === d ? "opacity-80" : "text-muted-foreground")}>dagen</span>
              </button>
            ))}
          </div>
        );
      case "experience":
        return <ChoiceList options={CHOICES.experience} value={a.experience} onChange={(v) => set("experience", v)} />;
      case "program": {
        const genderLabel = a.gender === "vrouw" ? "voor vrouwen" : a.gender === "man" ? "voor mannen" : "voor iedereen";
        return (
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Programma's {genderLabel}, {a.daysPerWeek} dagen</p>
            {recommended.slice(0, 5).map((p, i) => (
              <ProgramCard key={p.id} program={p} selected={programId === p.id} recommended={i === 0} onSelect={() => set("programId", p.id)} />
            ))}
          </div>
        );
      }
      case "summary":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["kcal", "Calorieën", "kcal", 50],
                  ["protein", "Eiwit", "g", 5],
                  ["carbs", "Koolhydraten", "g", 5],
                  ["fat", "Vet", "g", 5],
                  ["waterMl", "Water", "l", 0.25],
                  ["targetWeight", "Streefgewicht", "kg", 0.5],
                ] as [keyof Goals, string, string, number][]
              ).map(([key, label, unit, stepSize]) => {
                const isWater = key === "waterMl";
                return (
                  <div key={key} className="rounded-2xl border bg-card p-3">
                    <p className="mb-1 text-xs font-semibold text-muted-foreground">{label}</p>
                    <NumberStepper value={isWater ? effectiveGoals.waterMl / 1000 : effectiveGoals[key]} onChange={(v) => setGoals({ ...effectiveGoals, [key]: isWater ? Math.round(v * 1000) : v })} step={stepSize} unit={unit} />
                  </div>
                );
              })}
            </div>
            <div className="rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
              Berekend met Mifflin-St Jeor op {a.weight} kg, {a.heightCm} cm, {a.age} jaar, {CHOICES.activity.find((x) => x.v === a.activity)?.l.toLowerCase()} en doel “{CHOICES.goal.find((x) => x.v === a.goalType)?.l.toLowerCase()}”. Programma: {PROGRAMS.find((p) => p.id === programId)?.name}.
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-primary/10 p-3 text-sm">
              <Flame className="size-4 shrink-0 text-primary" />
              <span>Elke dag dat je alle doelen haalt telt voor je streak en levert bonus-XP op.</span>
            </div>
          </div>
        );
    }
  };

  const variants = {
    initial: (d: number) => ({ opacity: 0, x: d * 32 }),
    animate: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d * -32 }),
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col bg-background safe-top">
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Dumbbell className="size-4" />
          </div>
          <span className="font-extrabold tracking-tight">GainTrack</span>
        </div>
        <span className="text-xs font-semibold tabular-nums text-muted-foreground">
          {step + 1} / {STEPS.length}
        </span>
      </div>
      <div className="mx-6 mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div className="h-full rounded-full bg-primary" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ type: "spring", stiffness: 200, damping: 28 }} />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div key={current.id} custom={dir} variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.22 }} className="pt-8">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{current.question}</h1>
            <p className="mt-2 text-muted-foreground">{current.help}</p>
            <div className="mt-7">{body()}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3">
        {step > 0 && (
          <Button variant="secondary" size="lg" onClick={back} aria-label="Vorige vraag">
            <ArrowLeft className="size-4" />
          </Button>
        )}
        {current.id !== "summary" ? (
          <Button size="lg" className="flex-1" onClick={next} disabled={!canNext}>
            {step === 0 && !a.name.trim() ? "Overslaan" : "Volgende"} <ArrowRight className="size-4" />
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
