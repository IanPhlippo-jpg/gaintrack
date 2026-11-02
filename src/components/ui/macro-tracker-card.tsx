/**
 * Calorie Tracker Card (21st.dev / kavikatiyar tracker-card) - geanimeerde teller en voortgangsbalk,
 * uitgebreid met drie macrobalken.
 */
import * as React from "react";
import { motion, useSpring, useTransform } from "motion/react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Macro {
  label: string;
  value: number;
  goal: number;
  color: string;
}

export interface MacroTrackerCardProps {
  currentCalories: number;
  goalCalories: number;
  macros: Macro[];
  onRecord?: () => void;
  className?: string;
}

export function MacroTrackerCard({ className, currentCalories, goalCalories, macros, onRecord }: MacroTrackerCardProps) {
  const pct = Math.min((currentCalories / goalCalories) * 100, 100);
  const over = currentCalories > goalCalories * 1.1;
  const animated = useSpring(0, { damping: 40, stiffness: 300 });
  const display = useTransform(animated, (v) => Math.round(v).toLocaleString("nl-BE"));
  React.useEffect(() => {
    animated.set(currentCalories);
  }, [currentCalories, animated]);
  const left = goalCalories - currentCalories;

  return (
    <div className={cn("flex w-full flex-col gap-5 rounded-3xl border bg-card p-5 text-card-foreground", className)}>
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Calorieën</h2>
            <p className="text-xs text-muted-foreground">{left >= 0 ? `Nog ${Math.round(left).toLocaleString("nl-BE")} kcal over` : `${Math.round(-left).toLocaleString("nl-BE")} kcal boven doel`}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <motion.p className={cn("text-5xl font-bold tracking-tighter tabular-nums", over && "text-chart-5")}>{display}</motion.p>
          <p className="mb-1.5 font-medium text-muted-foreground">van {goalCalories.toLocaleString("nl-BE")}</p>
          <p className="mb-1.5 ml-auto text-sm font-medium">kcal</p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
          <motion.div className={cn("h-full rounded-full", over ? "bg-chart-5" : "bg-primary")} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: "easeInOut" }} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {macros.map((m) => {
          const p = Math.min(100, (m.value / m.goal) * 100);
          return (
            <div key={m.label} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{Math.round(m.value)}/{m.goal} g</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full rounded-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${p}%` }} transition={{ duration: 1, ease: "easeInOut" }} />
              </div>
            </div>
          );
        })}
      </div>

      {onRecord && (
        <Button onClick={onRecord} size="lg" className="w-full rounded-full">
          + Maaltijd loggen
        </Button>
      )}
    </div>
  );
}
