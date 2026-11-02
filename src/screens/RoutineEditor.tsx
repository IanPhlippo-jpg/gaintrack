/**
 * Eigen schema maken of bewerken: naam en emoji, trainingsdagen, oefeningen met sets/herhalingen/rust.
 * Oefeningen voeg je met meerdere tegelijk toe; per oefening klap je de instellingen open.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "@/components/ui/drawer";
import { NumberStepper } from "@/components/ui/number-stepper";
import { ExerciseMedia } from "@/components/ui/exercise-media";
import { ExercisePicker } from "./ExercisePicker";
import { useStore } from "@/store/useStore";
import type { Routine, RoutineExercise } from "@/store/types";
import { exerciseById } from "@/lib/stats";
import { WEEKDAYS_NL } from "@/lib/date";
import { cn } from "@/lib/utils";

const EMOJIS = ["💪", "🔥", "🦵", "🍑", "🏋️", "⚡", "✨", "🎯", "💥", "🏠", "🧘", "🏃"];

function ExerciseRow({ item, index, total, expanded, onToggle, onChange, onMove, onRemove }: {
  item: RoutineExercise;
  index: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<RoutineExercise>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const state = useStore();
  const ex = exerciseById(state, item.exerciseId);
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card", expanded && "border-primary/50")}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">{index + 1}</span>
        {ex && <ExerciseMedia exercise={ex} size="thumb" showLabels={false} auto={false} className="h-12 w-12" />}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{ex?.name ?? item.exerciseId}</span>
          <span className="block text-xs text-muted-foreground">
            {item.sets} × {item.reps} · {item.restSec} s rust
          </span>
        </span>
        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}>
            <div className="space-y-3 border-t px-3 pb-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Sets</p>
                  <NumberStepper value={item.sets} step={1} min={1} max={10} onChange={(v) => onChange({ sets: v })} />
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Herhalingen</p>
                  <NumberStepper value={item.reps} step={1} min={1} max={100} onChange={(v) => onChange({ reps: v })} />
                </div>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">Rust tussen sets</p>
                <NumberStepper value={item.restSec} step={15} min={0} max={600} unit="seconden" onChange={(v) => onChange({ restSec: v })} />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Omhoog">
                  <ArrowUp className="size-4" />
                </Button>
                <Button size="sm" variant="secondary" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Omlaag">
                  <ArrowDown className="size-4" />
                </Button>
                <Button size="sm" variant="outline" className="ml-auto text-destructive" onClick={onRemove}>
                  <Trash2 className="size-4" /> Verwijder
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RoutineEditor({ routine, onClose }: { routine: Routine | null; onClose: () => void }) {
  const state = useStore();
  const [draft, setDraft] = React.useState<Routine | null>(routine);
  const [picker, setPicker] = React.useState(false);
  const [emojiOpen, setEmojiOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [added, setAdded] = React.useState(0);

  React.useEffect(() => {
    setDraft(routine);
    setExpanded(null);
    setConfirmDelete(false);
    setEmojiOpen(false);
  }, [routine]);

  if (!draft) return <Drawer open={false} onOpenChange={() => {}}>{null}</Drawer>;
  const isNew = !state.routines.some((r) => r.id === draft.id);
  const update = (patch: Partial<Routine>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const move = (i: number, dir: -1 | 1) => {
    const arr = [...draft.exercises];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update({ exercises: arr });
    setExpanded(j);
  };
  const canSave = draft.name.trim().length >= 2 && draft.exercises.length > 0;
  const pickedIds = draft.exercises.map((e) => e.exerciseId);
  const pickedDbIds = draft.exercises.map((e) => exerciseById(state, e.exerciseId)?.dbId).filter((x): x is string => !!x);

  return (
    <Drawer open={!!routine} onOpenChange={(o) => !o && onClose()} title={isNew ? "Nieuw schema" : "Schema bewerken"} description={isNew ? "Geef een naam, kies je dagen en voeg oefeningen toe." : undefined} full>
      <div className="space-y-5">
        <div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEmojiOpen((o) => !o)} className={cn("grid size-12 shrink-0 place-items-center rounded-xl border bg-card text-2xl", emojiOpen && "border-primary")} aria-label="Emoji kiezen">
              {draft.emoji || "💪"}
            </button>
            <Input value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="Naam, bv. Billen & benen" className="flex-1" autoFocus={isNew && !draft.name} />
          </div>
          {emojiOpen && (
            <div className="mt-2 grid grid-cols-6 gap-1.5">
              {EMOJIS.map((em) => (
                <button key={em} type="button" onClick={() => { update({ emoji: em }); setEmojiOpen(false); }} className={cn("grid h-11 place-items-center rounded-xl border bg-card text-xl", draft.emoji === em && "border-primary bg-primary/15")}>
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Trainingsdagen</p>
          <div className="grid grid-cols-7 gap-1">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const on = draft.days.includes(d);
              return (
                <button key={d} type="button" onClick={() => update({ days: on ? draft.days.filter((x) => x !== d) : [...draft.days, d].sort() })} className={cn("rounded-xl border py-2.5 text-xs font-bold transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
                  {WEEKDAYS_NL[d]}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{draft.days.length === 0 ? "Geen vaste dag: je start dit schema wanneer je wilt." : `${draft.days.length} × per week`}</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold">Oefeningen</p>
            <span className="text-xs text-muted-foreground">{draft.exercises.length} gekozen · tik om aan te passen</span>
          </div>
          {draft.exercises.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">Nog geen oefeningen. Voeg er hieronder een of meerdere toe.</div>
          ) : (
            <div className="space-y-2">
              {draft.exercises.map((item, i) => (
                <ExerciseRow
                  key={`${item.exerciseId}-${i}`}
                  item={item}
                  index={i}
                  total={draft.exercises.length}
                  expanded={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                  onChange={(patch) => update({ exercises: draft.exercises.map((x, j) => (j === i ? { ...x, ...patch } : x)) })}
                  onMove={(dir) => move(i, dir)}
                  onRemove={() => { update({ exercises: draft.exercises.filter((_, j) => j !== i) }); setExpanded(null); }}
                />
              ))}
            </div>
          )}
          <Button variant="outline" className="mt-2 w-full border-dashed" onClick={() => { setAdded(0); setPicker(true); }}>
            <Plus className="size-4" /> Oefeningen toevoegen
          </Button>
        </div>

        <div className="space-y-2 pt-2">
          <Button size="lg" className="w-full" disabled={!canSave} onClick={() => { state.saveRoutine({ ...draft, name: draft.name.trim(), emoji: draft.emoji || "💪" }); onClose(); }}>
            <Check className="size-4" /> {isNew ? "Schema opslaan" : "Wijzigingen opslaan"}
          </Button>
          {!canSave && <p className="text-center text-xs text-muted-foreground">{draft.name.trim().length < 2 ? "Geef je schema een naam." : "Voeg minstens één oefening toe."}</p>}
          {!isNew && (
            confirmDelete ? (
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={() => { state.removeRoutine(draft.id); onClose(); }}>Ja, verwijder schema</Button>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Annuleer</Button>
              </div>
            ) : (
              <Button variant="ghost" className="w-full text-destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" /> Schema verwijderen
              </Button>
            )
          )}
        </div>
      </div>

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        multi
        picked={{ ids: pickedIds, dbIds: pickedDbIds }}
        addedCount={added}
        onPick={(e) => {
          update({ exercises: [...draft.exercises, { exerciseId: e.id, sets: 3, reps: 10, restSec: 90 }] });
          setAdded((n) => n + 1);
        }}
      />
    </Drawer>
  );
}
