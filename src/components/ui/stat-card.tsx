/**
 * Stat Card (21st.dev / ravikatiyar162 card-10) - kerngetal met tel-animatie en trend.
 */
import * as React from "react";
import { motion, useSpring, useTransform, animate } from "motion/react";
import { cn } from "@/lib/utils";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: number;
  unit?: string;
  decimals?: number;
  change?: number;
  changeDescription?: string;
  icon?: React.ReactNode;
  /** hogere waarde is beter (voor kleur van de trend) */
  higherIsBetter?: boolean;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(({ title, value, unit, decimals = 0, change, changeDescription, icon, higherIsBetter = true, className, ...props }, ref) => {
  const positive = change === undefined ? true : higherIsBetter ? change >= 0 : change <= 0;
  const motionValue = useSpring(0, { damping: 100, stiffness: 100 });
  const displayValue = useTransform(motionValue, (latest) => latest.toLocaleString("nl-BE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }));

  React.useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1.2, ease: "easeOut" });
    return controls.stop;
  }, [value, motionValue]);

  return (
    <div ref={ref} className={cn("flex flex-col gap-1 rounded-2xl border bg-card p-4 text-card-foreground", className)} role="region" aria-label={`${title}: ${value}`} {...props}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <motion.h3 className="text-3xl font-bold tracking-tighter tabular-nums">{displayValue}</motion.h3>
        {unit && <span className="text-sm font-semibold text-muted-foreground">{unit}</span>}
      </div>
      {change !== undefined && (
        <p className="text-xs text-muted-foreground">
          <span className={cn("font-semibold", positive ? "text-primary" : "text-chart-5")}>
            {change > 0 ? "+" : ""}
            {change.toLocaleString("nl-BE", { maximumFractionDigits: 1 })}
            {unit ? ` ${unit}` : ""}
          </span>
          {changeDescription && <span> {changeDescription}</span>}
        </p>
      )}
    </div>
  );
});
StatCard.displayName = "StatCard";

export { StatCard };
