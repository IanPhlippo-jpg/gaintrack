import * as React from "react";
import { Camera, Check, Plus, Search } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExerciseMedia } from "@/components/ui/exercise-media";
import { EmptyState } from "@/components/page-header";
import { useStore } from "@/store/useStore";
import type { Exercise } from "@/store/types";
import { EQUIPMENT, EXERCISE_DB, MUSCLES, MUSCLE_GROUPS, SEED_EXERCISES, type DbExercise } from "@/data/exercises";
import { allExercises } from "@/lib/stats";
import { cn } from "@/lib/utils";

/** Zoekt in eigen + basisoefeningen en in de volledige fotodatabase (876 oefeningen). */
export function useExerciseSearch(query: string, group: string | null) {
  const customExercises = useStore((s) => s.customExercises);
  return React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const muscles = group ? MUSCLE_GROUPS.find((g) => g.id === group)?.muscles ?? [] : null;
    const own = allExercises({ customExercises }).filter((e) => (!q || e.name.toLowerCase().includes(q)) && (!muscles || muscles.includes(e.muscle) || (group === "core" && e.muscle === "abdominals")));
    const ownDb = new Set(own.map((e) => e.dbId).filter(Boolean));
    const db: DbExercise[] = q.length >= 2 || muscles ? EXERCISE_DB.filter((e) => !ownDb.has(e.id) && e.img > 0 && (!q || e.n.toLowerCase().includes(q)) && (!muscles || muscles.includes(e.m))).slice(0, 60) : [];
    return { own, db };
  }, [query, group, customExercises]);
}

export const dbToExercise = (d: DbExercise): Omit<Exercise, "id" | "custom"> => ({ name: d.n, muscle: d.m, equipment: d.q, dbId: d.id });

export function ExercisePicker({ open, onClose, onPick, title = "Oefening kiezen", multi = false, picked, addedCount = 0 }: {
  open: boolean;
  onClose: () => void;
  onPick: (e: Exercise) => void;
  title?: string;
  /** Kiezer blijft open; elke tik voegt een oefening toe. */
  multi?: boolean;
  /** Al gekozen oefeningen (eigen id's en database-id's) om aan te vinken. */
  picked?: { ids: string[]; dbIds: string[] };
  /** Aantal toegevoegd sinds openen (voor de Klaar-knop). */
  addedCount?: number;
}) {
  const [q, setQ] = React.useState("");
  const [group, setGroup] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const { own, db } = useExerciseSearch(q, group);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setGroup(null);
      setCreating(false);
    }
  }, [open]);

  const pickDb = (d: DbExercise) => onPick(addCustomExercise(dbToExercise(d)));
  const isPicked = (e: { id?: string; dbId?: string }) => !!picked && ((!!e.id && picked.ids.includes(e.id)) || (!!e.dbId && picked.dbIds.includes(e.dbId)));

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title={creating ? "Eigen oefening" : multi ? "Oefeningen toevoegen" : title} description={creating ? "Met eigen foto of een foto uit de database" : multi ? "Tik op een oefening om ze toe te voegen; je kunt er meerdere kiezen." : `${SEED_EXERCISES.length} basisoefeningen · ${EXERCISE_DB.length} met foto in de database`} full>
      {multi && !creating && (
        <div className="sticky top-0 z-10 -mx-5 -mt-4 mb-3 flex items-center justify-between gap-3 border-b bg-popover/95 px-5 py-2.5 backdrop-blur">
          <p className="text-sm">
            <span className="font-bold text-primary">{addedCount}</span> <span className="text-muted-foreground">{addedCount === 1 ? "oefening toegevoegd" : "oefeningen toegevoegd"}</span>
          </p>
          <Button size="sm" onClick={onClose}>
            <Check className="size-4" /> Klaar
          </Button>
        </div>
      )}
      {creating ? (
        <CustomExerciseForm onDone={(e) => onPick(e)} onCancel={() => setCreating(false)} />
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek oefening (NL of EN)…" className="pl-10" />
          </div>
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 no-scrollbar">
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => setCreating(true)}>
              <Plus className="size-3.5" /> Eigen
            </Button>
            {MUSCLE_GROUPS.map((g) => (
              <button key={g.id} type="button" onClick={() => setGroup(group === g.id ? null : g.id)} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold", group === g.id ? "border-primary bg-primary/10 text-primary" : "bg-card")}>
                {g.label}
              </button>
            ))}
          </div>
          {own.length === 0 && db.length === 0 ? (
            <EmptyState icon="🔍" title="Geen oefening gevonden" desc="Probeer een Engelse naam of maak een eigen oefening." />
          ) : (
            <>
              {own.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {own.map((e) => (
                    <button key={e.id} type="button" onClick={() => onPick(e)} className={cn("relative overflow-hidden rounded-2xl border bg-card text-left active:scale-[0.98]", isPicked(e) && "border-primary ring-2 ring-primary/40")}>
                      <ExerciseMedia exercise={e} size="card" auto={false} className="rounded-none" />
                      {isPicked(e) && (
                        <span className="absolute right-2 top-2 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {db.length > 0 && (
                <>
                  <p className="pt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Uit de fotodatabase</p>
                  <ul className="divide-y divide-border overflow-hidden rounded-2xl border">
                    {db.map((d) => (
                      <li key={d.id}>
                        <button type="button" onClick={() => pickDb(d)} className="flex w-full items-center gap-3 bg-card p-2.5 text-left active:bg-accent/50">
                          <ExerciseMedia exercise={{ name: d.n, muscle: d.m, equipment: d.q, dbId: d.id }} size="thumb" showLabels={false} auto={false} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{d.n}</p>
                            <p className="text-xs text-muted-foreground">
                              {MUSCLES[d.m] ?? d.m} · {EQUIPMENT[d.q] ?? d.q}
                            </p>
                          </div>
                          {isPicked({ dbId: d.id }) ? <Check className="size-4 text-primary" /> : <Plus className="size-4 text-muted-foreground" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}
    </Drawer>
  );
}

export async function fileToDataUrl(file: File, max = 900): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function CustomExerciseForm({ onDone, onCancel, initial }: { onDone: (e: Exercise) => void; onCancel: () => void; initial?: Exercise }) {
  const addCustomExercise = useStore((s) => s.addCustomExercise);
  const updateExercise = useStore((s) => s.updateExercise);
  const [name, setName] = React.useState(initial?.name ?? "");
  const [muscle, setMuscle] = React.useState(initial?.muscle ?? "chest");
  const [equipment, setEquipment] = React.useState(initial?.equipment ?? "barbell");
  const [photo, setPhoto] = React.useState<string | undefined>(initial?.photo);
  const [dbId, setDbId] = React.useState<string | undefined>(initial?.dbId);
  const [dbQuery, setDbQuery] = React.useState("");
  const dbMatches = React.useMemo(() => {
    const q = dbQuery.trim().toLowerCase();
    return q.length < 2 ? [] : EXERCISE_DB.filter((e) => e.img > 0 && e.n.toLowerCase().includes(q)).slice(0, 8);
  }, [dbQuery]);

  const save = () => {
    const data = { name: name.trim(), muscle, equipment, photo, dbId };
    if (initial?.custom) {
      updateExercise(initial.id, data);
      onDone({ ...initial, ...data });
    } else onDone(addCustomExercise(data));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border">
        <ExerciseMedia exercise={{ name: name || "Nieuwe oefening", muscle, equipment, dbId, photo }} size="card" className="rounded-none" />
      </div>
      <div className="flex gap-2">
        <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm font-semibold">
          <Camera className="size-4" /> {photo ? "Andere foto" : "Eigen foto"}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setPhoto(await fileToDataUrl(f)); setDbId(undefined); } }} />
        </label>
        {photo && (
          <Button variant="outline" onClick={() => setPhoto(undefined)}>
            Foto weg
          </Button>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Of kies een foto uit de database</label>
        <Input value={dbQuery} onChange={(e) => setDbQuery(e.target.value)} placeholder="Engelse naam, bv. 'curl'" />
        {dbMatches.length > 0 && (
          <div className="mt-2 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar">
            {dbMatches.map((d) => (
              <button key={d.id} type="button" onClick={() => { setDbId(d.id); setPhoto(undefined); if (!name) setName(d.n); setMuscle(d.m); setEquipment(d.q); }} className={cn("shrink-0 overflow-hidden rounded-xl border", dbId === d.id && "ring-2 ring-primary")}>
                <ExerciseMedia exercise={{ name: d.n, muscle: d.m, equipment: d.q, dbId: d.id }} size="thumb" showLabels={false} auto={false} />
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">Naam</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="bv. Cable fly laag" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Spiergroep</label>
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background/60 px-3 text-sm">
            {Object.entries(MUSCLES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">Materiaal</label>
          <select value={equipment} onChange={(e) => setEquipment(e.target.value)} className="h-12 w-full rounded-xl border border-input bg-background/60 px-3 text-sm">
            {Object.entries(EQUIPMENT).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="lg" onClick={onCancel}>
          Annuleer
        </Button>
        <Button size="lg" className="flex-1" disabled={name.trim().length < 2} onClick={save}>
          {initial?.custom ? "Bijwerken" : "Opslaan en kiezen"}
        </Button>
      </div>
    </div>
  );
}
