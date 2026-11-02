import * as React from "react";
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

/**
 * Getallen tonen met komma als decimaalteken (nl-BE) en nooit meer decimalen dan de stap.
 * Tijdens het typen werkt het veld met een eigen buffer: de waarde wordt pas afgerond en
 * begrensd (min/max) bij het verlaten van het veld of op Enter, zodat "8" + "2" niet eerst
 * als 808 wordt gelezen en op het maximum blijft hangen.
 */
export function NumberStepper({ value, onChange, step = 1, min = 0, max = 9999, decimals, unit, size = "sm", className }: NumberStepperProps) {
  const stepDecimals = (String(step).split(".")[1] ?? "").length;
  const d = Math.max(stepDecimals, decimals ?? 0);
  const clampRound = (v: number) => Number(Math.min(max, Math.max(min, v)).toFixed(d));
  const set = (v: number) => onChange(clampRound(Math.round(v / step) * step));
  const big = size === "lg";
  const shown = Number.isFinite(value) ? value.toLocaleString("nl-BE", { minimumFractionDigits: 0, maximumFractionDigits: d }) : "";

  // null = niet aan het typen. Bij focus wordt het veld leeggemaakt (oude waarde als placeholder),
  // zodat ook op iOS, waar select-all bij een tik niet betrouwbaar is, cijfers nooit achter de oude waarde komen.
  const [draft, setDraft] = React.useState<string | null>(null);

  const parse = (text: string) => {
    const raw = text.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
    if (raw === "" || raw === "-" || raw === ".") return null;
    const v = parseFloat(raw);
    return Number.isNaN(v) ? null : v;
  };

  const commit = () => {
    if (draft !== null) {
      const v = parse(draft);
      if (v !== null) onChange(clampRound(v));
    }
    setDraft(null);
  };

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
            enterKeyHint="done"
            value={draft ?? shown}
            placeholder={shown}
            onChange={(e) => {
              // Enkel cijfers, komma/punt en een minteken toelaten in de buffer.
              const text = e.target.value.replace(/[^0-9.,-]/g, "");
              setDraft(text);
            }}
            onFocus={() => setDraft("")}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className={cn(
              "w-full rounded-xl border border-input bg-background/60 text-center font-bold tabular-nums placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring",
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
