/**
 * Rusttimer - gebaseerd op het 21st.dev "Workout Timer" ontwerp (anubra266): oranje-rood verloop, groot getal.
 * Eigen implementatie zonder Ark UI.
 */
import * as React from "react";
import { Minus, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function useRestTimer() {
  const [total, setTotal] = React.useState(90);
  const [left, setLeft] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const endRef = React.useRef<number>(0);

  const start = React.useCallback((seconds: number) => {
    setTotal(seconds);
    setLeft(seconds);
    endRef.current = Date.now() + seconds * 1000;
    setRunning(true);
  }, []);

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(l);
      if (l <= 0) {
        setRunning(false);
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          /* geen trilfunctie */
        }
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  const pause = () => setRunning(false);
  const resume = () => {
    endRef.current = Date.now() + left * 1000;
    setRunning(true);
  };
  const adjust = (d: number) => {
    const l = Math.max(0, left + d);
    setLeft(l);
    setTotal((t) => Math.max(t, l));
    endRef.current = Date.now() + l * 1000;
  };
  const stop = () => {
    setRunning(false);
    setLeft(0);
  };
  return { total, left, running, start, pause, resume, adjust, stop, active: left > 0 || running };
}

export function RestTimer({ timer, className }: { timer: ReturnType<typeof useRestTimer>; className?: string }) {
  const pct = timer.total > 0 ? (timer.left / timer.total) * 100 : 0;
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#5A3B8C] to-[#8B7CC7] p-4 text-white shadow-[0_16px_40px_-16px_rgba(139,124,199,0.7)]", className)}
    >
      <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
        <div className="h-full bg-white transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Rust</p>
          <p className="text-4xl font-bold tabular-nums leading-none">
            {Math.floor(timer.left / 60)}:{String(timer.left % 60).padStart(2, "0")}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => timer.adjust(-15)} className="rounded-full bg-white/20 p-2 backdrop-blur hover:bg-white/30" aria-label="15 seconden minder">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => timer.adjust(15)} className="rounded-full bg-white/20 p-2 backdrop-blur hover:bg-white/30" aria-label="15 seconden meer">
            <Plus className="h-4 w-4" />
          </button>
          {timer.running ? (
            <button type="button" onClick={timer.pause} className="rounded-full bg-white/20 p-2 backdrop-blur hover:bg-white/30" aria-label="Pauze">
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={timer.resume} className="rounded-full bg-white/20 p-2 backdrop-blur hover:bg-white/30" aria-label="Hervat">
              <Play className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={() => timer.start(timer.total)} className="rounded-full bg-white/20 p-2 backdrop-blur hover:bg-white/30" aria-label="Opnieuw">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" onClick={timer.stop} className="rounded-full bg-white/20 p-2 backdrop-blur hover:bg-white/30" aria-label="Stop">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
