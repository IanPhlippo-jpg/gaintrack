import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Flag, Plus, Timer, Trash2, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { ExerciseMedia } from "@/components/ui/exercise-media";
import { RestTimer, useRestTimer } from "@/components/ui/rest-timer";
import { CountUp } from "@/components/ui/count-up";
import { useConfetti } from "@/components/ui/confetti";
import { ExercisePicker } from "./ExercisePicker";
import { useStore } from "@/store/useStore";
import type { Workout } from "@/store/types";
import { exerciseById, lastPerformance, personalRecords } from "@/lib/stats";
import { durationMin, e1rm, workoutSets, workoutVolume } from "@/lib/calc";
import { XP } from "@/lib/gamification";
import { cn } from "@/lib/utils";
import { NumberStepper } from "@/components/ui/number-stepper";
import { cancelRestPush, onPendingLog, scheduleRestPush, takePendingLog } from "@/lib/push";

// Voorstel voor een set: wat je al invulde, anders de vorige set van deze oefening, anders vorige keer.
// Leest de store rechtstreeks, zodat ook net ingevulde waarden meetellen.
function suggestie(exIndex: number, setIndex: number) {
  const st = useStore.getState();
  const ex = st.activeWorkout?.exercises[exIndex];
  const set = ex?.sets[setIndex];
  if (!ex || !set) return { weight: 0, reps: 0 };
  const vorigeSet = ex.sets[setIndex - 1];
  const vorigeKeer = lastPerformance(st, ex.exerciseId)?.sets[setIndex];
  return { weight: set.weight || vorigeSet?.weight || vorigeKeer?.weight || 0, reps: set.reps || vorigeSet?.reps || vorigeKeer?.reps || 0 };
}

function useElapsed(start: number) {
  const [, tick] = React.useReducer((x: number) => x + 1, 0);
  React.useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor((Date.now() - start) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function ActiveWorkout({ onFinished }: { onFinished: (w: Workout) => void }) {
  const state = useStore();
  const w = state.activeWorkout!;
  const routine = state.routines.find((r) => r.id === w.routineId);
  const elapsed = useElapsed(w.startedAt);
  const timer = useRestTimer();
  const fire = useConfetti();
  const [picker, setPicker] = React.useState(false);
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState<Record<number, boolean>>({});
  const prs = React.useMemo(() => personalRecords(state), [state.workouts]); // eslint-disable-line react-hooks/exhaustive-deps

  const volume = workoutVolume(w);
  const sets = workoutSets(w);

  const [quick, setQuick] = React.useState<{ exIndex: number; setIndex: number; weight: number; reps: number } | null>(null);
  const lastDone = React.useRef<{ exIndex: number; setIndex: number } | null>(null);

  const toggleDone = (exIndex: number, setIndex: number, vals?: { weight: number; reps: number }) => {
    const set = { ...w.exercises[exIndex].sets[setIndex], ...vals };
    const done = !set.done;
    state.updateSet(exIndex, setIndex, { done, ...vals });
    if (done) lastDone.current = { exIndex, setIndex };
    if (done) {
      const { settings } = state;
      if (settings.restEnabled) {
        const routineRest = routine?.exercises.find((r) => r.exerciseId === w.exercises[exIndex].exerciseId)?.restSec;
        const rest = settings.restForAll || !routineRest ? settings.restSec : routineRest;
        if (rest > 0) timer.start(rest);
      }
      const pr = prs[w.exercises[exIndex].exerciseId];
      if (set.reps > 0 && pr && e1rm(set.weight, set.reps) > pr.e1rm + 0.01) fire({ particleCount: 50, y: window.innerHeight * 0.5 });
      if (settings.haptics) {
        try {
          navigator.vibrate?.(30);
        } catch {
          /* geen trilfunctie */
        }
      }
    }
  };

  // De volgende set die nog open staat: na de laatst afgevinkte, anders de eerste open set.
  const volgendeSet = () => {
    const alle = w.exercises.flatMap((ex, exIndex) => ex.sets.map((s, setIndex) => ({ exIndex, setIndex, done: s.done })));
    const l = lastDone.current;
    const vanaf = l ? alle.findIndex((x) => x.exIndex === l.exIndex && x.setIndex === l.setIndex) + 1 : 0;
    return [...alle.slice(vanaf), ...alle.slice(0, vanaf)].find((x) => !x.done) ?? null;
  };

  // App naar de achtergrond terwijl de rust loopt: melding laten plannen. Terug in beeld: melding schrappen.
  const latest = React.useRef({ timer, volgendeSet, w, state });
  latest.current = { timer, volgendeSet, w, state };
  React.useEffect(() => {
    const onVis = () => {
      const { timer, volgendeSet, w, state } = latest.current;
      if (document.visibilityState === "visible") return cancelRestPush();
      if (!state.settings.pushEnabled || !timer.running) return;
      const delaySec = Math.round((timer.endAt() - Date.now()) / 1000);
      const v = volgendeSet();
      let body = "Tijd voor je volgende set.";
      let url = import.meta.env.BASE_URL;
      if (v) {
        const naam = exerciseById(state, w.exercises[v.exIndex].exerciseId)?.name ?? "Volgende oefening";
        const s = suggestie(v.exIndex, v.setIndex);
        body = `${naam}, set ${v.setIndex + 1}${s.reps ? `: ${s.weight} kg × ${s.reps}` : ""}. Tik om in te vullen.`;
        url += `?log=${v.exIndex}.${v.setIndex}`;
      }
      scheduleRestPush({ delaySec, title: "Rust voorbij", body, url });
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onVis);
    };
  }, []);

  // Tik op de melding: snel-invulscherm voor die set openen.
  React.useEffect(() => {
    const open = () => {
      const p = takePendingLog();
      const set = p && useStore.getState().activeWorkout?.exercises[p.exIndex]?.sets[p.setIndex];
      if (!p || !set || set.done) return;
      setQuick({ ...p, ...suggestie(p.exIndex, p.setIndex) });
    };
    open();
    return onPendingLog(open);
  }, []);

  const quickNaam = quick ? (exerciseById(state, w.exercises[quick.exIndex]?.exerciseId)?.name ?? "") : "";
  const quickVorige = quick ? lastPerformance(state, w.exercises[quick.exIndex]?.exerciseId)?.sets[quick.setIndex] : undefined;

  const finish = () => {
    const done = state.finishWorkout();
    if (done) {
      fire({ particleCount: 140, spread: 130 });
      onFinished(done);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl safe-top">
        <button type="button" onClick={() => setConfirmCancel(true)} aria-label="Training stoppen" className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <X className="size-5" />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-bold">{w.name}</p>
          <p className="text-xs tabular-nums text-muted-foreground">
            <Timer className="mr-1 inline size-3" />
            {elapsed} · {sets} sets · {volume.toLocaleString("nl-BE")} kg
          </p>
        </div>
        <button
          type="button"
          onClick={() => state.setSettings({ restEnabled: !state.settings.restEnabled })}
          aria-label={state.settings.restEnabled ? "Rusttimer uitzetten" : "Rusttimer aanzetten"}
          title={state.settings.restEnabled ? `Rusttimer aan (${state.settings.restSec}s)` : "Rusttimer uit"}
          className={cn("grid size-10 place-items-center rounded-full", state.settings.restEnabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}
        >
          <Timer className="size-5" />
        </button>
        <Button size="sm" onClick={finish} disabled={sets === 0}>
          <Flag className="size-4" /> Klaar
        </Button>
      </header>

      <AnimatePresence>
        {timer.active && (
          <div className="sticky top-[64px] z-20 px-4 pt-3">
            <RestTimer timer={timer} />
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 space-y-3 px-4 py-3 pb-28">
        {w.exercises.map((ex, exIndex) => {
          const def = exerciseById(state, ex.exerciseId);
          const prev = lastPerformance(state, ex.exerciseId);
          const pr = prs[ex.exerciseId];
          const doneCount = ex.sets.filter((s) => s.done).length;
          const isCollapsed = collapsed[exIndex];
          return (
            <Card key={`${ex.exerciseId}-${exIndex}`} className="overflow-hidden">
              <button type="button" onClick={() => setCollapsed((c) => ({ ...c, [exIndex]: !c[exIndex] }))} className="flex w-full items-center gap-3 p-3 text-left">
                {def && <ExerciseMedia exercise={def} size="thumb" showLabels={false} auto={!isCollapsed} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{def?.name ?? ex.exerciseId}</p>
                  <p className="text-xs text-muted-foreground">
                    {prev ? `Vorige: ${prev.sets.map((s) => `${s.weight}×${s.reps}`).slice(0, 4).join(", ")}` : "Eerste keer"}
                    {pr && ` · PR ${Math.round(pr.e1rm)} kg e1RM`}
                  </p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", doneCount === ex.sets.length && ex.sets.length > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  {doneCount}/{ex.sets.length}
                </span>
                <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")} />
              </button>

              {!isCollapsed && (
                <div className="border-t border-border">
                  <div className="grid grid-cols-[2rem_1fr_1fr_1fr_2.75rem] items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    <span>Set</span>
                    <span>Vorige</span>
                    <span className="text-center">kg</span>
                    <span className="text-center">Herh.</span>
                    <span />
                  </div>
                  {ex.sets.map((set, setIndex) => {
                    const p = prev?.sets[setIndex];
                    const isPr = set.done && set.reps > 0 && pr && e1rm(set.weight, set.reps) > pr.e1rm + 0.01;
                    return (
                      <motion.div
                        key={set.id}
                        layout
                        className={cn("grid grid-cols-[2rem_1fr_1fr_1fr_2.75rem] items-center gap-2 px-3 py-1.5", set.done && "bg-primary/10")}
                      >
                        <span className="text-sm font-bold tabular-nums text-muted-foreground">{setIndex + 1}</span>
                        <button type="button" onClick={() => p && state.updateSet(exIndex, setIndex, { weight: p.weight, reps: p.reps })} className="truncate text-left text-xs tabular-nums text-muted-foreground">
                          {p ? `${p.weight}×${p.reps}` : "—"}
                        </button>
                        <input
                          type="number"
                          inputMode="decimal"
                          step={0.5}
                          value={set.weight || ""}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => state.updateSet(exIndex, setIndex, { weight: parseFloat(e.target.value.replace(",", ".")) || 0 })}
                          className="h-10 w-full rounded-lg border border-input bg-background/60 text-center text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps || ""}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => state.updateSet(exIndex, setIndex, { reps: parseInt(e.target.value) || 0 })}
                          className="h-10 w-full rounded-lg border border-input bg-background/60 text-center text-base font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <button
                          type="button"
                          onClick={() => toggleDone(exIndex, setIndex)}
                          aria-label={set.done ? "Set ongedaan maken" : "Set afvinken"}
                          className={cn("grid size-10 place-items-center rounded-lg transition-colors", set.done ? (isPr ? "bg-chart-2 text-black" : "bg-primary text-primary-foreground") : "bg-muted text-muted-foreground")}
                        >
                          {isPr ? <Trophy className="size-4" /> : <Check className="size-5" strokeWidth={3} />}
                        </button>
                      </motion.div>
                    );
                  })}
                  <div className="flex items-center justify-between p-2">
                    <Button variant="ghost" size="sm" onClick={() => state.removeExerciseFromWorkout(exIndex)} className="text-muted-foreground">
                      <Trash2 className="size-3.5" /> Oefening
                    </Button>
                    <div className="flex gap-1">
                      {ex.sets.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => state.removeSet(exIndex, ex.sets.length - 1)}>
                          − set
                        </Button>
                      )}
                      <Button variant="secondary" size="sm" onClick={() => state.addSet(exIndex)}>
                        <Plus className="size-3.5" /> set
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <Button variant="outline" size="lg" className="w-full border-dashed" onClick={() => setPicker(true)}>
          <Plus className="size-4" /> Oefening toevoegen
        </Button>
      </div>

      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={(e) => { state.addExerciseToWorkout(e.id); setPicker(false); }} title="Oefening toevoegen" />

      <Drawer open={!!quick} onOpenChange={(o) => !o && setQuick(null)} title={quickNaam} description={quick ? `Set ${quick.setIndex + 1}${quickVorige ? ` · vorige keer ${quickVorige.weight} kg × ${quickVorige.reps}` : ""}` : undefined}>
        {quick && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Gewicht</p>
                <NumberStepper value={quick.weight} onChange={(v) => setQuick({ ...quick, weight: v })} step={2.5} min={0} max={500} unit="kg" size="lg" />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Herhalingen</p>
                <NumberStepper value={quick.reps} onChange={(v) => setQuick({ ...quick, reps: v })} step={1} min={0} max={100} unit="reps" size="lg" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="lg" className="flex-1" disabled={quick.reps === 0} onClick={() => { toggleDone(quick.exIndex, quick.setIndex, { weight: quick.weight, reps: quick.reps }); setQuick(null); }}>
                <Check className="size-5" strokeWidth={3} /> Set opslaan
              </Button>
              <Button variant="secondary" size="lg" onClick={() => setQuick(null)}>
                Later
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={confirmCancel} onOpenChange={setConfirmCancel} title="Training stoppen?" description="Niet-afgevinkte sets gaan verloren.">
        <div className="flex gap-2">
          <Button variant="destructive" size="lg" className="flex-1" onClick={() => { state.cancelWorkout(); setConfirmCancel(false); }}>
            Stop zonder opslaan
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setConfirmCancel(false)}>
            Verder trainen
          </Button>
        </div>
      </Drawer>
    </div>
  );
}

export function WorkoutSummary({ workout, onClose }: { workout: Workout | null; onClose: () => void }) {
  const customExercises = useStore((s) => s.customExercises);
  if (!workout) return <Drawer open={false} onOpenChange={() => {}}>{null}</Drawer>;
  const sets = workoutSets(workout);
  const volume = workoutVolume(workout);
  const xp = XP.workout + sets * XP.set + (workout.prs?.length ?? 0) * XP.pr;
  return (
    <Drawer open={!!workout} onOpenChange={(o) => !o && onClose()} title="Training afgewerkt!" description={`${workout.name} · ${durationMin(workout)} min`}>
      <div className="space-y-4">
        <div className="rounded-3xl bg-primary p-5 text-center text-primary-foreground">
          <p className="text-xs font-bold uppercase tracking-wide opacity-80">Verdiend</p>
          <p className="text-5xl font-extrabold tracking-tight">
            +<CountUp to={xp} duration={1.2} /> XP
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            [sets, "sets"],
            [volume.toLocaleString("nl-BE"), "kg volume"],
            [workout.exercises.length, "oefeningen"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-muted p-3">
              <p className="text-xl font-bold tabular-nums">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>
        {workout.prs && workout.prs.length > 0 && (
          <div className="rounded-2xl border border-chart-2/50 bg-chart-2/10 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-sm font-bold text-chart-2">
              <Trophy className="size-4" /> {workout.prs.length} nieuw{workout.prs.length > 1 ? "e" : ""} record{workout.prs.length > 1 ? "s" : ""}!
            </p>
            <p className="text-xs text-muted-foreground">{workout.prs.map((id) => exerciseById({ customExercises }, id)?.name ?? id).join(", ")}</p>
          </div>
        )}
        <Button size="lg" className="w-full" onClick={onClose}>
          Top!
        </Button>
      </div>
    </Drawer>
  );
}
