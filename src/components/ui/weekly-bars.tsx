/**
 * Weekly Fitness Card (21st.dev / shadcnspace card-12) - zeven dagkolommen met balkjes.
 */
import { cn } from "@/lib/utils";

export interface WeeklyBarDatum {
  day: string;
  /** 0..100 */
  value: number;
  highlight?: boolean;
  label?: string;
}

export function WeeklyBars({ data, className, color = "bg-primary" }: { data: WeeklyBarDatum[]; className?: string; color?: string }) {
  return (
    <div className={cn("grid grid-cols-7 gap-1.5", className)}>
      {data.map((item, index) => (
        <div key={index} className={cn("rounded-xl p-1.5 text-center ring-1 ring-border", item.highlight && "ring-primary/60")}>
          <div className={cn("text-[11px]", item.highlight ? "font-bold text-primary" : "text-muted-foreground")}>{item.day}</div>
          <div className="relative mt-1 h-14 overflow-hidden rounded-md bg-muted">
            <div className={cn("absolute inset-x-0 bottom-0 rounded-md transition-[height] duration-700", color)} style={{ height: `${Math.max(0, Math.min(100, item.value))}%` }} />
          </div>
          {item.label && <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">{item.label}</div>}
        </div>
      ))}
    </div>
  );
}
