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

/** Getallen tonen met komma als decimaalteken (nl-BE) en nooit meer decimalen dan de stap */
export function NumberStepper({ value, onChange, step = 1, min = 0, max = 9999, decimals, unit, size = "sm", className }: NumberStepperProps) {
  const stepDecimals = (String(step).split(".")[1] ?? "").length;
  const d = Math.max(stepDecimals, decimals ?? 0);
  const clampRound = (v: number) => Number(Math.min(max, Math.max(min, v)).toFixed(d));
  const set = (v: number) => onChange(clampRound(Math.round(v / step) * step));
  const big = size === "lg";
  const shown = Number.isFinite(value) ? value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: d }) : "";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button type="button" onClick={() => set(value - step)} className={cn("flex shrink-0 items-center justify-center rounded-xl bg-muted text-foreground active:bg-accent", big ? "size-14" : "size-10")} aria-label="Minder">
        <Minus className={big ? "size-6" : "size-4"} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col items-stretch">
        <div className="relative">
          <input
            type="text"
            inputMode="decimal"
            value={shown}
            onChange={(e) => {
              const raw = e.target.value.replace(/\./g, "").replace(",", ".");
              if (raw === "" || raw === "-") return onChange(0);
              const v = parseFloat(raw);
              if (!Number.isNaN(v)) onChange(clampRound(v));
            }}
            onFocus={(e) => e.target.select()}
            className={cn(
              "w-full rounded-xl border border-input bg-background/60 text-center font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-ring",
              big ? "h-14 text-3xl" : "h-10 text-base",
              big && unit && "pr-10",
            )}
            aria-label={unit ? `Waarde in ${unit}` : "Waarde"}
          />
          {big && unit && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{unit}</span>}
        </div>
        {!big && unit && <span className="mt-0.5 text-center text-[10px] leading-none text-muted-foreground">{unit}</span>}
      </div>
      <button type="button" onClick={() => set(value + step)} className={cn("flex shrink-0 items-center justify-center rounded-xl bg-muted text-foreground active:bg-accent", big ? "size-14" : "size-10")} aria-label="Meer">
        <Plus className={big ? "size-6" : "size-4"} />
      </button>
    </div>
  );
}
