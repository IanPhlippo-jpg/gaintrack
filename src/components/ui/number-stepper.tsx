import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  decimals?: number;
  unit?: string;
  size?: "sm" | "lg";
  className?: string;
}

export function NumberStepper({ value, onChange, step = 1, min = 0, max = 9999, decimals = 0, unit, size = "sm", className }: NumberStepperProps) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)));
  const big = size === "lg";
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button type="button" onClick={() => set(value - step)} className={cn("flex shrink-0 items-center justify-center rounded-xl bg-muted text-foreground active:bg-accent", big ? "size-14" : "size-10")} aria-label="Minder">
        <Minus className={big ? "size-6" : "size-4"} />
      </button>
      <div className="relative flex-1">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const v = parseFloat(e.target.value.replace(",", "."));
            if (!Number.isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
            else if (e.target.value === "") onChange(0);
          }}
          onFocus={(e) => e.target.select()}
          className={cn("w-full rounded-xl border border-input bg-background/60 text-center font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring", big ? "h-14 text-3xl" : "h-10 text-base")}
        />
        {unit && <span className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground", big ? "text-sm" : "text-[10px]")}>{unit}</span>}
      </div>
      <button type="button" onClick={() => set(value + step)} className={cn("flex shrink-0 items-center justify-center rounded-xl bg-muted text-foreground active:bg-accent", big ? "size-14" : "size-10")} aria-label="Meer">
        <Plus className={big ? "size-6" : "size-4"} />
      </button>
      {decimals > 0 && <span className="sr-only">{decimals} decimalen</span>}
    </div>
  );
}
