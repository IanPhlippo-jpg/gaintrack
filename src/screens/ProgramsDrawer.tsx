/**
 * Kant-en-klare programma's kiezen: per groep (vrouwen / mannen / iedereen) en per aantal trainingsdagen.
 */
import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import AnimatedTabs from "@/components/ui/animated-tabs";
import { useStore } from "@/store/useStore";
import { PROGRAMS, recommendPrograms, type Program } from "@/data/programs";
import { WEEKDAYS_NL } from "@/lib/date";
import { cn } from "@/lib/utils";

type ProgramGroup = "vrouw" | "man" | "iedereen";
const DAY_OPTIONS = [0, 2, 3, 4, 5, 6] as const;

export function ProgramsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useStore();
  const profile = state.profile;
  const [group, setGroup] = React.useState<ProgramGroup>(profile.gender === "vrouw" ? "vrouw" : profile.gender === "man" ? "man" : "iedereen");
  const [days, setDays] = React.useState<number>(profile.daysPerWeek || 0);
  const [confirm, setConfirm] = React.useState<Program | null>(null);

  React.useEffect(() => {
    if (open) setDays(profile.daysPerWeek || 0);
  }, [open, profile.daysPerWeek]);

  const recommended = React.useMemo(() => recommendPrograms(profile.gender, profile.daysPerWeek, profile.experience)[0]?.id, [profile.gender, profile.daysPerWeek, profile.experience]);
  const list = PROGRAMS.filter((p) => p.gender === group && (days === 0 || p.days === days)).sort((a, b) => a.days - b.days || a.level.localeCompare(b.level));
  const activeId = profile.programId;
  const countFor = (d: number) => PROGRAMS.filter((p) => p.gender === group && (d === 0 || p.days === d)).length;

  return (
    <>
      <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Trainingsprogramma's" description="Kies op basis van hoeveel dagen je wilt trainen. Elk schema kun je daarna zelf aanpassen." full>
        <AnimatedTabs<ProgramGroup> variant="segment" activeTab={group} onChange={setGroup} tabs={[{ id: "vrouw", label: "Vrouwen" }, { id: "man", label: "Mannen" }, { id: "iedereen", label: "Iedereen" }]} className="mb-3" />
        <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 no-scrollbar">
          {DAY_OPTIONS.map((d) => {
            const n = countFor(d);
            return (
              <button
                key={d}
                type="button"
                disabled={n === 0}
                onClick={() => setDays(d)}
                className={cn("shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-35", days === d ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
              >
                {d === 0 ? "Alle dagen" : `${d} dagen`}
                {d === profile.daysPerWeek && d !== 0 && <span className="ml-1 opacity-70">· jouw keuze</span>}
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">Geen programma voor deze combinatie. Kies een ander aantal dagen.</div>
        ) : (
          <div className="space-y-3">
            {list.map((p) => {
              const isActive = activeId === p.id;
              const isRecommended = recommended === p.id;
              return (
                <div key={p.id} className={cn("rounded-2xl border bg-card p-4", isActive && "border-primary bg-primary/10", !isActive && isRecommended && "border-primary/50")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-bold">{p.name}</p>
                        {isActive && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Actief</span>}
                        {!isActive && isRecommended && (
                          <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                            <Sparkles className="size-3" /> Aanbevolen
                          </span>
                        )}
                      </div>
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
                        <span className="truncate">
                          {r.emoji} {r.name}
                        </span>
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
        )}
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
