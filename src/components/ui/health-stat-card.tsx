/**
 * Health Stat Card (21st.dev / ruixen.ui) - drie kernstatistieken met geanimeerde bubbelbalken en tooltips.
 */
import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface StatData {
  title: string;
  value: string | number;
  unit?: string;
  changePercent?: number;
  changeDirection?: "up" | "down";
}

export interface HealthGraphData {
  label: string;
  value: number;
  color?: string;
  description?: string;
}

export interface HealthStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  headerIcon?: React.ReactNode;
  title: string;
  stats: StatData[];
  graphData?: HealthGraphData[];
  graphHeight?: number;
  showLegend?: boolean;
  legendTitle?: string;
}

export const HealthStatCard = React.forwardRef<HTMLDivElement, HealthStatCardProps>(({ className, headerIcon, title, stats, graphData, graphHeight = 100, showLegend = true, legendTitle = "Verdeling", ...props }, ref) => {
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const barVariants = { hidden: { scaleY: 0 }, visible: { scaleY: 1, transition: { type: "spring" as const, stiffness: 100, damping: 15 } } };

  return (
    <div ref={ref} className={cn("w-full rounded-3xl border bg-card p-5 text-card-foreground", className)} {...props}>
      <div className="mb-4 flex items-center gap-3">
        {headerIcon && <div className="text-primary">{headerIcon}</div>}
        <h2 className="text-base font-bold tracking-tight">{title}</h2>
      </div>
      <div className={cn("mb-5 grid gap-3 text-center", stats.length === 3 ? "grid-cols-3" : stats.length === 4 ? "grid-cols-4" : "grid-cols-2")}>
        {stats.map((item, i) => (
          <div key={i}>
            <div className="flex items-baseline justify-center gap-1">
              <p className="text-xl font-bold tabular-nums">{item.value}</p>
              {item.unit && <span className="text-xs text-muted-foreground">{item.unit}</span>}
            </div>
            <p className="text-[11px] text-muted-foreground">{item.title}</p>
            {item.changePercent !== undefined && (
              <div className={cn("mt-0.5 text-[11px] font-semibold", item.changeDirection === "up" ? "text-primary" : "text-chart-5")}>
                {item.changeDirection === "up" ? "▲" : "▼"} {Math.abs(item.changePercent)}%
              </div>
            )}
          </div>
        ))}
      </div>
      {graphData && (
        <TooltipProvider delayDuration={100}>
          <div className="rounded-2xl bg-muted/50 p-3">
            <motion.div className="flex w-full items-end justify-between gap-2" variants={containerVariants} initial="hidden" animate="visible" style={{ height: graphHeight }}>
              {graphData.map((bar, i) => (
                <Tooltip key={i}>
                  <TooltipTrigger asChild>
                    <motion.div
                      className="flex-1 cursor-pointer rounded-full"
                      style={{ height: `${Math.max(4, Math.min(100, bar.value))}%`, background: `linear-gradient(180deg, ${bar.color} 0%, color-mix(in oklch, ${bar.color} 75%, transparent) 100%)`, originY: 1 }}
                      variants={barVariants}
                      whileHover={{ scale: 1.08, y: -4, transition: { type: "spring", stiffness: 200, damping: 10 } }}
                      whileTap={{ scale: 0.95 }}
                    />
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    <p className="font-semibold">{bar.label}</p>
                    <p className="text-muted-foreground">{Math.round(bar.value)}%</p>
                    {bar.description && <p className="mt-1 text-muted-foreground">{bar.description}</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </motion.div>
          </div>
        </TooltipProvider>
      )}
      {showLegend && graphData && (
        <div className="mt-4">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">{legendTitle}</h4>
          <div className="grid grid-cols-2 gap-2">
            {graphData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">
                  {item.label} ({Math.round(item.value)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
HealthStatCard.displayName = "HealthStatCard";
