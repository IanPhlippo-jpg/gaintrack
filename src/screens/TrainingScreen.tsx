import * as React from "react";
import { motion } from "motion/react";
import { ArrowDown, ArrowUp, Clock, Pencil, Play, Plus, Trash2, Trophy } from "lucide-react";
import { PageHeader, Section, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { NumberStepper } from "@/components/ui/number-stepper";
import { ExerciseMedia } from "@/components/ui/exercise-media";
import AnimatedTabs from "@/components/ui/animated-tabs";
import { ActiveWorkout } from "./ActiveWorkout";
import { CustomExerciseForm, ExercisePicker, useExerciseSearch, dbToExercise } from "./ExercisePicker";
import { useStore } from "@/store/useStore";
import type { Exercise, Routine, Workout } from "@/store/types";
import { EQUIPMENT, MUSCLES, MUSCLE_GROUPS } from "@/data/exercises";
import { PROGRAMS, type Program } from "@/data/programs";
import { exerciseById, lastPerformance, personalRecords, routinesForDay, strengthHistory } from "@/lib/stats";
import { durationMin, workoutSets, workoutVolume } from "@/lib/calc";
import { fmtDay, fmtShort, todayKey, WEEKDAYS_NL } from "@/lib/date";
import { cn, uid } from "@/lib/utils";

type TrainTab = "schema" | "oefeningen" | "historiek";

export function TrainingScreen() {
  const active = useStore((s) => s.activeWorkout);
  const [tab, setTab] = React.useState<TrainTab>("schema");
  if (active) return <ActiveWorkout />;
  return (
    <div>
      <PageHeader title="Training" subtitle={fmtDay(todayKey())} />
      <Section>
        <AnimatedTabs<TrainTab> variant="segment" activeTab={tab} onChange={setTab} tabs={[{ id: "schema", label: "Schema" }, { id: "oefeningen", label: "Oefeningen" }, { id: "historiek", label: "Historiek" }]} />
      </Section>
      {tab === "schema" && <RoutinesTab />}
      {tab === "oefeningen" && <ExercisesTab />}
      {tab === "historiek" && <HistoryTab />}
    </div>
  );
}

/* ---------- Schema's ---------- */

function RoutinesTab() {
  const state = useStore();
  const today = todayKey();
  const planned = routinesForDay(state, today);
  const [editing, setEditing] = React.useState<Routine | null>(null);
  const [templates, setTemplates] = React.useState(false);
  const order = [...planned, ...state.routines.filter((r) => !planned.includes(r))];

  return (
    <>
      <Section>
        {planned.length === 0 && (
          <Card className="mb-3 flex items-center justify-between gap-3 bg-muted/40 p-4">
            <div>
              <p className="font-bold">Rustdag volgens je schema</p>
              <p className="text-xs text-muted-foreground">Toch zin? Start een vrije training of een schema hieronder.</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => state.startWorkout()}>
              <Play className="size-4" /> Vrij
            </Button>
          </Card>
        )}
        <div className="space-y-3">
          {order.map((r, i) => (
            <RoutineCard key={r.id} routine={r} isToday={planned.includes(r)} index={i} onEdit={() => setEditing(r)} onStart={() => state.startWorkout(r)} />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="outline" size="lg" className="border-dashed" onClick={() => setEditing({ id: uid(), name: "", emoji: "💪", exercises: [], days: [] })}>
            <Plus className="size-4" /> Nieuw schema
          </Button>
          <Button variant="outline" size="lg" className="border-dashed" onClick={() => setTemplates(true)}>
            Programma's
          </Button>
        </div>
        {planned.length > 0 && (
          <Button variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => state.startWorkout()}>
            <Play className="size-4" /> Vrije training zonder schema
          </Button>
        )}
      </Section>

      <RoutineEditor routine={editing} onClose={() => setEditing(null)} />

      <ProgramsDrawer open={templates} onClose={() => setTemplates(false)} />
    </>
  );
}

type ProgramGroup = "vrouw" | "man" | "iedereen";

function ProgramsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useStore();
  const [group, setGroup] = React.useState<ProgramGroup>(state.profile.gender === "vrouw" ? "vrouw" : state.profile.gender === "man" ? "man" : "iedereen");
  const [confirm, setConfirm] = React.useState<Program | null>(null);
  const list = PROGRAMS.filter((p) => p.gender === group).sort((a, b) => a.days - b.days);
  const activeId = state.profile.programId;

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Trainingsprogramma's" description="Kant-en-klare schema's, opgesplitst voor vrouwen en mannen. Je kunt elk schema daarna aanpassen." full>
        <AnimatedTabs<ProgramGroup> variant="segment" activeTab={group} onChange={setGroup} tabs={[{ id: "vrouw", label: "Vrouwen" }, { id: "man", label: "Mannen" }, { id: "iedereen", label: "Iedereen" }]} className="mb-3" />
        <div className="space-y-3">
          {list.map((p) => {
            const isActive = activeId === p.id;
            return (
              <div key={p.id} className={cn("rounded-2xl border bg-card p-4", isActive && "border-primary bg-primary/10")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {p.name} {isActive && <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Actief</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.days} dagen · {p.level} · {p.focus}
                    </p>
                  </div>
                  <span className="shrink-0 text-2xl">{p.routines[0]?.emoji}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-3 space-y-1">
                  {p.routines.map((r) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <span className="w-14 shrink-0 font-semibold text-muted-foreground">{r.days.map((d) => WEEKDAYS_NL[d]).join("/")}</span>
                      <span className="truncate">{r.name}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground">{r.exercises.length} oef.</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="flex-1" disabled={isActive} onClick={() => setConfirm(p)}>
                    {isActive ? "In gebruik" : "Gebruik dit programma"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => { state.applyProgram(p.id, p.routines, false); onClose(); }}>
                    Voeg toe
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>
      <Drawer open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)} title="Programma wisselen?" description="Je huidige schema's worden vervangen. Je trainingshistoriek en records blijven bewaard.">
        <div className="flex gap-2">
          <Button size="lg" className="flex-1" onClick={() => { if (confirm) state.applyProgram(confirm.id, confirm.routines, true); setConfirm(null); onClose(); }}>
            Ja, vervang
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setConfirm(null)}>
            Annuleer
          </Button>
        </div>
      </Drawer>
    </>
  );
}

/** Op basis van de 21st.dev "Workout Card" (ravikatiyar162): header met duur en een gestaffeld animerende oefeningenlijst. */
function RoutineCard({ routine, isToday, index, onEdit, onStart }: { routine: Routine; isToday: boolean; index: number; onEdit: () => void; onStart: () => void }) {
  const state = useStore();
  const [open, setOpen] = React.useState(isToday);
  const minutes = routine.exercises.reduce((a, e) => a + e.sets * (e.restSec + 40), 0) / 60;
  const listVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 120, damping: 14 } } };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={cn("rounded-3xl p-2", isToday ? "bg-primary/10 ring-1 ring-primary/40" : "bg-muted/50")}>
      {isToday && <p className="px-3 pb-1 pt-1 text-center text-[11px] font-bold uppercase tracking-wide text-primary">Vandaag op het programma</p>}
      <div className="rounded-2xl bg-card p-4 shadow-sm">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-2 text-left">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-2xl">{routine.emoji}</span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold">{routine.name}</h3>
              <p className="text-xs text-muted-foreground">
                {routine.exercises.length} oefeningen · {routine.days.length ? routine.days.map((d) => WEEKDAYS_NL[d]).join(", ") : "geen vaste dag"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <Clock className="size-3.5" />
            <span>~{Math.round(minutes)} min</span>
          </div>
        </button>

        {open && (
          <motion.ul role="list" className="mt-4 space-y-2" initial="hidden" animate="visible" variants={listVariants}>
            {routine.exercises.map((rx, i) => {
              const ex = exerciseById(state, rx.exerciseId);
              const last = lastPerformance(state, rx.exerciseId);
              return (
                <motion.li key={`${rx.exerciseId}-${i}`} className="flex items-center gap-3 rounded-xl bg-muted p-2" variants={itemVariants}>
                  {ex ? <ExerciseMedia exercise={ex} size="thumb" showLabels={false} auto={false} className="h-12 w-12" /> : <div className="h-12 w-12 rounded-xl bg-accent" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{ex?.name ?? rx.exerciseId}</p>
                    <p className="text-xs text-muted-foreground">
                      {rx.sets} × {rx.reps} · rust {rx.restSec}s{last ? ` · vorige ${last.sets[0]?.weight} kg` : ""}
                    </p>
                  </div>
                </motion.li>
              );
            })}
            {routine.exercises.length === 0 && <li className="rounded-xl bg-muted p-3 text-center text-xs text-muted-foreground">Nog geen oefeningen. Bewerk het schema.</li>}
          </motion.ul>
        )}

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="icon" onClick={onEdit} aria-label="Schema bewerken">
            <Pencil className="size-4" />
          </Button>
          <Button className="flex-1" onClick={onStart} disabled={routine.exercises.length === 0}>
            <Play className="size-4" /> Start training
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function RoutineEditor({ routine, onClose }: { routine: Routine | null; onClose: () => void }) {
  const state = useStore();
  const [draft, setDraft] = React.useState<Routine | null>(routine);
  const [picker, setPicker] = React.useState(false);
  React.useEffect(() => setDraft(routine), [routine]);
  if (!draft) return <Drawer open={false} onOpenChange={() => {}}>{null}</Drawer>;
  const isNew = !state.routines.some((r) => r.id === draft.id);
  const update = (patch: Partial<Routine>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const move = (i: number, dir: -1 | 1) => {
    const arr = [...draft.exercises];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ exercises: arr });
  };

  return (
    <Drawer open={!!routine} onOpenChange={(o) => !o && onClose()} title={isNew ? "Nieuw schema" : "Schema bewerken"} full>
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input value={draft.emoji} onChange={(e) => update({ emoji: e.target.value.slice(-2) })} className="w-16 text-center text-xl" aria-label="Emoji" />
          <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="Naam, bv. Push A" className="flex-1" />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold">Trainingsdagen</p>
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button key={d} type="button" onClick={() => update({ days: draft.days.includes(d) ? draft.days.filter((x) => x !== d) : [...draft.days, d] })} className={cn("rounded-xl border py-2 text-xs font-bold", draft.days.includes(d) ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                {WEEKDAYS_NL[d]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold">Oefeningen</p>
          <div className="space-y-2">
            {draft.exercises.map((rx, i) => {
              const ex = exerciseById(state, rx.exerciseId);
              return (
                <div key={`${rx.exerciseId}-${i}`} className="rounded-2xl border bg-card p-3">
                  <div className="flex items-center gap-3">
                    {ex && <ExerciseMedia exercise={ex} size="thumb" showLabels={false} auto={false} className="h-12 w-12" />}
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold">{ex?.name ?? rx.exerciseId}</p>
                    <button type="button" onClick={() => move(i, -1)} className="p-1 text-muted-foreground" aria-label="Omhoog">
                      <ArrowUp className="size-4" />
                    </button>
                    <button type="button" onClick={() => move(i, 1)} className="p-1 text-muted-foreground" aria-label="Omlaag">
                      <ArrowDown className="size-4" />
                    </button>
                    <button type="button" onClick={() => update({ exercises: draft.exercises.filter((_, j) => j !== i) })} className="p-1 text-destructive" aria-label="Verwijderen">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {(
                      [
                        ["sets", "Sets", 1, 1, 10],
                        ["reps", "Herh.", 1, 1, 100],
                        ["restSec", "Rust (s)", 15, 0, 600],
                      ] as ["sets" | "reps" | "restSec", string, number, number, number][]
                    ).map(([k, l, step, min, max]) => (
                      <div key={k}>
                        <p className="mb-0.5 text-[10px] font-semibold uppercase text-muted-foreground">{l}</p>
                        <NumberStepper value={rx[k]} step={step} min={min} max={max} onChange={(v) => update({ exercises: draft.exercises.map((x, j) => (j === i ? { ...x, [k]: v } : x)) })} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <Button variant="outline" className="mt-2 w-full border-dashed" onClick={() => setPicker(true)}>
            <Plus className="size-4" /> Oefening toevoegen
          </Button>
        </div>
        <div className="flex gap-2 pt-2">
          {!isNew && (
            <Button variant="destructive" size="lg" onClick={() => { state.removeRoutine(draft.id); onClose(); }} aria-label="Schema verwijderen">
              <Trash2 className="size-4" />
            </Button>
          )}
          <Button size="lg" className="flex-1" disabled={draft.name.trim().length < 2} onClick={() => { state.saveRoutine({ ...draft, name: draft.name.trim() }); onClose(); }}>
            Schema opslaan
          </Button>
        </div>
      </div>
      <ExercisePicker open={picker} onClose={() => setPicker(false)} onPick={(e) => { update({ exercises: [...draft.exercises, { exerciseId: e.id, sets: 3, reps: 10, restSec: 90 }] }); setPicker(false); }} />
    </Drawer>
  );
}

/* ---------- Oefeningen ---------- */

function ExercisesTab() {
  const state = useStore();
  const [q, setQ] = React.useState("");
  const [group, setGroup] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<Exercise | null>(null);
  const [creating, setCreating] = React.useState(false);
  const { own, db } = useExerciseSearch(q, group);
  const prs = personalRecords(state);

  return (
    <>
      <Section>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek oefening (NL of EN)…" />
        <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 no-scrollbar">
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCreating(true)}>
            <Plus className="size-3.5" /> Eigen oefening
          </Button>
          {MUSCLE_GROUPS.map((g) => (
            <button key={g.id} type="button" onClick={() => setGroup(group === g.id ? null : g.id)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold", group === g.id ? "border-primary bg-primary/10 text-primary" : "bg-card")}>
              {g.label}
            </button>
          ))}
        </div>
      </Section>
      <Section>
        <div className="grid grid-cols-2 gap-2">
          {own.map((e) => (
            <button key={e.id} type="button" onClick={() => setDetail(e)} className="relative overflow-hidden rounded-2xl border bg-card text-left active:scale-[0.98]">
              <ExerciseMedia exercise={e} size="card" auto={false} className="rounded-none" />
              {prs[e.id] && (
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
                  <Trophy className="size-3 text-chart-2" /> {Math.round(prs[e.id].e1rm)} kg
                </span>
              )}
            </button>
          ))}
        </div>
        {db.length > 0 && (
          <>
            <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">Meer uit de fotodatabase</p>
            <div className="grid grid-cols-2 gap-2">
              {db.map((d) => (
                <button key={d.id} type="button" onClick={() => setDetail({ id: "db:" + d.id, ...dbToExercise(d) })} className="overflow-hidden rounded-2xl border bg-card text-left active:scale-[0.98]">
                  <ExerciseMedia exercise={dbToExercise(d)} size="card" auto={false} className="rounded-none" />
                </button>
              ))}
            </div>
          </>
        )}
        {own.length === 0 && db.length === 0 && <EmptyState icon="🔍" title="Geen oefening gevonden" desc="Probeer een Engelse naam of maak een eigen oefening." />}
      </Section>
      <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} />
      <Drawer open={creating} onOpenChange={setCreating} title="Eigen oefening" description="Met eigen foto of een foto uit de database" full>
        <CustomExerciseForm onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
      </Drawer>
    </>
  );
}

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise | null; onClose: () => void }) {
  const state = useStore();
  const [edit, setEdit] = React.useState(false);
  React.useEffect(() => setEdit(false), [exercise]);
  if (!exercise) return <Drawer open={false} onOpenChange={() => {}}>{null}</Drawer>;
  const pr = personalRecords(state)[exercise.id];
  const last = lastPerformance(state, exercise.id);
  const hist = strengthHistory(state, exercise.id);
  const isDbOnly = exercise.id.startsWith("db:");

  return (
    <Drawer open={!!exercise} onOpenChange={(o) => !o && onClose()} title={exercise.name} description={`${MUSCLES[exercise.muscle] ?? exercise.muscle} · ${EQUIPMENT[exercise.equipment] ?? exercise.equipment}`} full>
      {edit ? (
        <CustomExerciseForm initial={exercise} onDone={() => setEdit(false)} onCancel={() => setEdit(false)} />
      ) : (
        <div className="space-y-4">
          <ExerciseMedia exercise={exercise} size="hero" />
          <p className="text-center text-xs text-muted-foreground">Tik op de foto om tussen start- en eindpositie te wisselen.</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-muted p-3">
              <p className="text-lg font-bold tabular-nums">{pr ? Math.round(pr.e1rm) : "—"}</p>
              <p className="text-[11px] text-muted-foreground">PR e1RM (kg)</p>
            </div>
            <div className="rounded-2xl bg-muted p-3">
              <p className="text-lg font-bold tabular-nums">{pr ? `${pr.set.weight}×${pr.set.reps}` : "—"}</p>
              <p className="text-[11px] text-muted-foreground">Beste set</p>
            </div>
            <div className="rounded-2xl bg-muted p-3">
              <p className="text-lg font-bold tabular-nums">{hist.length}</p>
              <p className="text-[11px] text-muted-foreground">Trainingen</p>
            </div>
          </div>
          {last && (
            <div className="rounded-2xl border bg-card p-3">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Vorige keer · {fmtShort(last.day)}</p>
              <p className="text-sm">{last.sets.map((s) => `${s.weight} kg × ${s.reps}`).join(" · ")}</p>
            </div>
          )}
          {exercise.custom && (
            <Button variant="secondary" className="w-full" onClick={() => setEdit(true)}>
              <Pencil className="size-4" /> Oefening bewerken
            </Button>
          )}
          {isDbOnly && (
            <Button className="w-full" onClick={() => { state.addCustomExercise({ name: exercise.name, muscle: exercise.muscle, equipment: exercise.equipment, dbId: exercise.dbId }); onClose(); }}>
              <Plus className="size-4" /> Toevoegen aan mijn oefeningen
            </Button>
          )}
        </div>
      )}
    </Drawer>
  );
}

/* ---------- Historiek ---------- */

function HistoryTab() {
  const state = useStore();
  const [detail, setDetail] = React.useState<Workout | null>(null);
  const list = [...state.workouts].reverse();
  const weekCount = state.workouts.filter((w) => w.day >= fmtWeekStart()).length;

  return (
    <>
      <Section>
        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deze week</p>
            <p className="text-2xl font-extrabold">
              {weekCount} <span className="text-base font-semibold text-muted-foreground">/ {state.goals.weeklyWorkouts} trainingen</span>
            </p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: state.goals.weeklyWorkouts }, (_, i) => (
              <span key={i} className={cn("h-8 w-2.5 rounded-full", i < weekCount ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
        </Card>
      </Section>
      <Section title={`${state.workouts.length} trainingen`}>
        {list.length === 0 ? (
          <EmptyState icon="📓" title="Nog geen trainingen" desc="Je afgewerkte trainingen verschijnen hier met volume, sets en records." />
        ) : (
          <div className="space-y-2">
            {list.map((w) => (
              <button key={w.id} type="button" onClick={() => setDetail(w)} className="flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left active:bg-accent/50">
                <div className="flex -space-x-3">
                  {w.exercises.slice(0, 3).map((ex, i) => {
                    const def = exerciseById(state, ex.exerciseId);
                    return def ? <ExerciseMedia key={i} exercise={def} size="thumb" showLabels={false} auto={false} className="h-10 w-10 rounded-full ring-2 ring-card" /> : null;
                  })}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{w.name}</p>
                  <p className="text-xs text-muted-foreground first-letter:uppercase">
                    {fmtDay(w.day, "EEE d MMM")} · {durationMin(w)} min · {workoutSets(w)} sets · {workoutVolume(w).toLocaleString("nl-BE")} kg
                  </p>
                </div>
                {w.prs && w.prs.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-chart-2/15 px-2 py-0.5 text-xs font-bold text-chart-2">
                    <Trophy className="size-3" /> {w.prs.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </Section>
      <Drawer open={!!detail} onOpenChange={(o) => !o && setDetail(null)} title={detail?.name} description={detail ? `${fmtDay(detail.day)} · ${durationMin(detail)} min · ${workoutVolume(detail).toLocaleString("nl-BE")} kg` : undefined} full>
        {detail && (
          <div className="space-y-3">
            {detail.exercises.map((ex, i) => {
              const def = exerciseById(state, ex.exerciseId);
              const isPr = detail.prs?.includes(ex.exerciseId);
              return (
                <div key={i} className="rounded-2xl border bg-card p-3">
                  <div className="flex items-center gap-3">
                    {def && <ExerciseMedia exercise={def} size="thumb" showLabels={false} auto={false} className="h-12 w-12" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{def?.name ?? ex.exerciseId}</p>
                      <p className="text-xs text-muted-foreground">{ex.sets.length} sets</p>
                    </div>
                    {isPr && <Trophy className="size-4 text-chart-2" />}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {ex.sets.map((s) => (
                      <span key={s.id} className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold tabular-nums">
                        {s.weight} × {s.reps}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
            <Button variant="outline" className="w-full text-destructive" onClick={() => { state.deleteWorkout(detail.id); setDetail(null); }}>
              <Trash2 className="size-4" /> Training verwijderen
            </Button>
          </div>
        )}
      </Drawer>
    </>
  );
}

function fmtWeekStart() {
  const d = new Date();
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return d.toISOString().slice(0, 10);
}
