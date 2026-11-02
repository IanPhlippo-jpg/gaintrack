/**
 * ExerciseMedia - het standaardontwerp voor een oefeningsfoto in GainTrack.
 *
 * - Toont een foto van iemand die de oefening uitvoert (startpositie en eindpositie wisselen af).
 * - Vaste verhouding 4:3, afgeronde hoeken, donker verloop onderaan met spiergroep en materiaal.
 * - Tik op de foto om tussen start/eind te wisselen; met `auto` wisselt hij vanzelf.
 * - Zonder foto: silhouet-placeholder met het eerste letterteken.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { EQUIPMENT, MUSCLES, exerciseImage } from "@/data/exercises";
import type { Exercise } from "@/store/types";

export interface ExerciseMediaProps {
  exercise: Pick<Exercise, "name" | "muscle" | "equipment" | "dbId" | "photo">;
  size?: "thumb" | "card" | "hero";
  auto?: boolean;
  className?: string;
  showLabels?: boolean;
}

const sizeClass = { thumb: "h-16 w-16 rounded-xl", card: "aspect-[4/3] w-full rounded-2xl", hero: "aspect-[4/3] w-full rounded-3xl" } as const;

export function ExerciseMedia({ exercise, size = "card", auto = size !== "thumb", className, showLabels = size !== "thumb" }: ExerciseMediaProps) {
  const [frame, setFrame] = React.useState<0 | 1>(0);
  const [failed, setFailed] = React.useState(false);
  const hasDb = !!exercise.dbId && !failed;
  const src = exercise.photo ?? (hasDb ? exerciseImage(exercise.dbId!, frame) : null);

  React.useEffect(() => {
    if (!auto || !hasDb || exercise.photo) return;
    const t = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1600);
    return () => clearInterval(t);
  }, [auto, hasDb, exercise.photo]);

  return (
    <div
      className={cn("relative shrink-0 select-none overflow-hidden bg-[#e9e6df] dark:bg-[#1c1f26]", sizeClass[size], className)}
      onClick={(e) => {
        if (!hasDb || exercise.photo) return;
        e.stopPropagation();
        setFrame((f) => (f === 0 ? 1 : 0));
      }}
      role="img"
      aria-label={`Foto van de oefening ${exercise.name}`}
    >
      {src ? (
        <AnimatePresence initial={false} mode="popLayout">
          <motion.img
            key={src}
            src={src}
            alt={exercise.name}
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </AnimatePresence>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <Camera className={size === "thumb" ? "size-5" : "size-8"} strokeWidth={1.5} />
          {size !== "thumb" && <span className="text-xs">Geen foto</span>}
        </div>
      )}

      {hasDb && !exercise.photo && size !== "thumb" && (
        <div className="absolute right-2 top-2 flex gap-1">
          {[0, 1].map((f) => (
            <span key={f} className={cn("h-1.5 rounded-full transition-all", frame === f ? "w-4 bg-white" : "w-1.5 bg-white/50")} />
          ))}
        </div>
      )}

      {showLabels && (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-3 pt-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{exercise.name}</p>
            <p className="text-[11px] text-white/75">
              {MUSCLES[exercise.muscle] ?? exercise.muscle} · {EQUIPMENT[exercise.equipment] ?? exercise.equipment}
            </p>
          </div>
          {hasDb && !exercise.photo && <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">{frame === 0 ? "Start" : "Eind"}</span>}
        </div>
      )}
    </div>
  );
}
