/**
 * Weekly Date Picker (21st.dev / kavikatiyar) - weekstrook, aangepast: week start op maandag, Nederlands, dag-indicatoren.
 */
import * as React from "react";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // maandag = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface WeeklyDatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: Date;
  setDate: (date: Date) => void;
  /** per dag (yyyy-MM-dd) een kleur voor het bolletje onder de dag */
  markers?: Record<string, "done" | "partial" | "none">;
  maxDate?: Date;
}

export const WeeklyDatePicker = React.forwardRef<HTMLDivElement, WeeklyDatePickerProps>(({ className, date, setDate, markers = {}, maxDate, ...props }, ref) => {
  const [displayDate, setDisplayDate] = useState(getStartOfWeek(date));
  const [direction, setDirection] = useState<"next" | "prev">("next");

  React.useEffect(() => {
    setDisplayDate(getStartOfWeek(date));
  }, [date]);

  const weekDays = useMemo(() => {
    const start = getStartOfWeek(displayDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [displayDate]);

  const shift = (days: number) => {
    setDirection(days > 0 ? "next" : "prev");
    setDisplayDate((prev) => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + days);
      return d;
    });
  };

  const variants = {
    initial: (dir: "next" | "prev") => ({ opacity: 0, x: dir === "next" ? 20 : -20 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeInOut" as const } },
    exit: (dir: "next" | "prev") => ({ opacity: 0, x: dir === "next" ? -20 : 20, transition: { duration: 0.2, ease: "easeInOut" as const } }),
  };

  const today = new Date();

  return (
    <div ref={ref} className={cn("w-full", className)} {...props}>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold capitalize text-muted-foreground">{format(displayDate, "MMMM yyyy", { locale: nl })}</p>
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={() => shift(-7)} aria-label="Vorige week">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => shift(7)} aria-label="Volgende week">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div className="relative h-[74px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div key={displayDate.toISOString()} className="absolute grid w-full grid-cols-7 gap-1" custom={direction} variants={variants} initial="initial" animate="animate" exit="exit">
            {weekDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const selected = isSameDay(day, date);
              const isToday = isSameDay(day, today);
              const disabled = !!maxDate && day > maxDate;
              const marker = markers[key];
              return (
                <button
                  key={key}
                  type="button"
                  disabled={disabled}
                  onClick={() => setDate(day)}
                  aria-pressed={selected}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl py-1.5 transition-colors disabled:opacity-30",
                    selected ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                  )}
                >
                  <span className={cn("text-[11px] uppercase", selected ? "text-primary-foreground/80" : "text-muted-foreground")}>{format(day, "EEEEEE", { locale: nl })}</span>
                  <span className={cn("text-base font-bold tabular-nums", isToday && !selected && "text-primary")}>{String(day.getDate()).padStart(2, "0")}</span>
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      marker === "done" ? (selected ? "bg-primary-foreground" : "bg-primary") : marker === "partial" ? (selected ? "bg-primary-foreground/60" : "bg-chart-2") : "bg-transparent",
                    )}
                  />
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});
WeeklyDatePicker.displayName = "WeeklyDatePicker";
