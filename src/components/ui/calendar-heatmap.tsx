/**
 * Calendar Heatmap (21st.dev / arihantcodes) - GitHub-stijl activiteitsgrid met streak-statistieken.
 * Aangepast: zelfstandige versie (geen chart-engine), Nederlandse labels, weken starten op maandag.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

export type CalendarDay = { t: number; value: number; perfect?: boolean };

const WEEKDAYS = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
const MONTH_FMT = new Intl.DateTimeFormat("nl-BE", { month: "short" });
const DAY_FMT = new Intl.DateTimeFormat("nl-BE", { weekday: "short", day: "numeric", month: "short" });
const DAY_MS = 86_400_000;
const EASE = "cubic-bezier(0.22,1,0.36,1)";

function useElementWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = React.useRef<T>(null);
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

function mondayStart(t: number) {
  const d = new Date(t);
  const wd = (d.getDay() + 6) % 7;
  return t - wd * DAY_MS;
}

const intensity = (step: number) => `color-mix(in oklch, var(--primary) ${[0, 30, 55, 80, 100][step]}%, var(--muted))`;

export interface CalendarHeatmapProps {
  className?: string;
  data: CalendarDay[];
  cell?: number;
  label?: string;
  streaks?: { current: number; longest: number };
}

export function CalendarHeatmap({ className, data, cell = 13, label = "XP", streaks }: CalendarHeatmapProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [hovered, setHovered] = React.useState<CalendarDay | null>(null);

  const byDay = React.useMemo(() => {
    const map = new Map<number, CalendarDay>();
    for (const day of data) map.set(day.t, day);
    return map;
  }, [data]);

  const weeks = React.useMemo(() => {
    if (!data.length) return [];
    const first = mondayStart(data[0].t);
    const last = mondayStart(data[data.length - 1].t);
    const columns: (CalendarDay | null)[][] = [];
    for (let w = first; w <= last; w += 7 * DAY_MS) {
      const column: (CalendarDay | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const t = w + d * DAY_MS;
        column.push(byDay.get(t) ?? (t >= data[0].t && t <= data[data.length - 1].t ? { t, value: 0 } : null));
      }
      columns.push(column);
    }
    return columns;
  }, [data, byDay]);

  const max = React.useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);
  const total = React.useMemo(() => data.reduce((s, d) => s + d.value, 0), [data]);
  const activeDays = data.filter((d) => d.value > 0).length;

  const LABEL_W = 26;
  const MONTH_H = 16;
  const available = Math.max(120, width - LABEL_W - 4);
  const size = Math.max(5, Math.min(cell, Math.floor(available / Math.max(weeks.length, 1)) - 2));
  const gapped = size + 2;
  const gridW = weeks.length * gapped;
  const gridH = 7 * gapped;
  const w = LABEL_W + gridW;
  const h = MONTH_H + gridH;

  const bucket = (value: number) => (value <= 0 ? 0 : Math.min(4, Math.ceil((value / max) * 4)));

  const monthMarks = React.useMemo(() => {
    const marks: { x: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((column, index) => {
      const day = column.find(Boolean);
      if (!day) return;
      const month = new Date(day.t).getMonth();
      if (month === lastMonth) return;
      lastMonth = month;
      const x = LABEL_W + index * gapped;
      if (marks.length && x - marks[marks.length - 1].x < 26) return;
      marks.push({ x, label: MONTH_FMT.format(day.t).replace(".", "") });
    });
    return marks;
  }, [weeks, gapped]);

  return (
    <div ref={wrapRef} className={cn("flex w-full flex-col text-muted-foreground", className)}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <p className="text-[13px] font-semibold text-foreground">
            {total.toLocaleString("nl-BE")} {label} · {activeDays} actieve dagen
          </p>
          {streaks && (
            <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
              {streaks.current} dagen huidige streak · {streaks.longest} langste
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          Minder
          {[0, 1, 2, 3, 4].map((step) => (
            <span key={step} className="size-[11px] rounded-[2.5px]" style={{ background: intensity(step) }} />
          ))}
          Meer
        </div>
      </div>

      <div className="relative w-full overflow-x-auto no-scrollbar">
        {width > 0 && (
          <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block select-none" role="img" aria-label={`${total} ${label} in het afgelopen jaar`} onPointerLeave={() => setHovered(null)}>
            <g>
              {monthMarks.map((m) => (
                <text key={`${m.x}-${m.label}`} x={m.x} y={11} fontSize={9.5} fill="currentColor">
                  {m.label}
                </text>
              ))}
              {[0, 2, 4, 6].map((row) => (
                <text key={row} x={0} y={MONTH_H + row * gapped + size / 2} dominantBaseline="middle" fontSize={9} fill="currentColor">
                  {WEEKDAYS[row]}
                </text>
              ))}
            </g>
            {weeks.map((column, col) =>
              column.map((day, row) => {
                if (!day) return null;
                const step = bucket(day.value);
                const active = hovered?.t === day.t;
                return (
                  <rect
                    key={day.t}
                    x={LABEL_W + col * gapped}
                    y={MONTH_H + row * gapped}
                    width={size}
                    height={size}
                    rx={Math.max(1.5, size * 0.22)}
                    fill={intensity(step)}
                    stroke={active ? "var(--foreground)" : day.perfect ? "var(--chart-2)" : "transparent"}
                    strokeWidth={1.25}
                    onPointerEnter={() => setHovered(day)}
                    onClick={() => setHovered(day)}
                    style={{ animation: `spectrum-mc-fade 320ms ease-out ${Math.min((col * 7 + row) * 1.2, 480)}ms both`, transition: `stroke 120ms ${EASE}` }}
                  />
                );
              }),
            )}
          </svg>
        )}
      </div>

      <p className="mt-2 h-4 text-[11px] tabular-nums text-foreground/80 transition-opacity duration-150" style={{ opacity: hovered ? 1 : 0 }} aria-live="polite">
        {hovered ? `${hovered.value === 0 ? "Geen" : hovered.value} ${label} op ${DAY_FMT.format(hovered.t)}${hovered.perfect ? " · perfecte dag" : ""}` : " "}
      </p>
    </div>
  );
}

export default CalendarHeatmap;
