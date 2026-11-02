import * as React from "react";
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Scale, Trash2 } from "lucide-react";
import { PageHeader, Section, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberStepper } from "@/components/ui/number-stepper";
import { StatCard } from "@/components/ui/stat-card";
import AnimatedTabs from "@/components/ui/animated-tabs";
import { WeeklyDatePicker } from "@/components/ui/weekly-date-picker";
import { useStore } from "@/store/useStore";
import { movingAverage, weeklyTrend } from "@/lib/calc";
import { dayKey, daysBetween, fmtDay, fmtShort, fromKey, todayKey } from "@/lib/date";
import { cn, round } from "@/lib/utils";

type Range = "30" | "90" | "365" | "all";

export function WeightScreen() {
  const weights = useStore((s) => s.weights);
  const goals = useStore((s) => s.goals);
  const profile = useStore((s) => s.profile);
  const logWeight = useStore((s) => s.logWeight);
  const removeWeight = useStore((s) => s.removeWeight);
  const [day, setDay] = React.useState(todayKey());
  const [range, setRange] = React.useState<Range>("90");
  const [saved, setSaved] = React.useState(false);

  const existing = weights.find((w) => w.day === day);
  const latest = weights[weights.length - 1];
  const [value, setValue] = React.useState(existing?.kg ?? latest?.kg ?? profile.startWeight);
  React.useEffect(() => {
    setValue(existing?.kg ?? latest?.kg ?? profile.startWeight);
  }, [day, existing?.kg, latest?.kg, profile.startWeight]);

  const markers = React.useMemo(() => Object.fromEntries(weights.map((w) => [w.day, "done" as const])), [weights]);

  const data = React.useMemo(() => {
    const cutoff = range === "all" ? null : dayKey(new Date(Date.now() - parseInt(range) * 86400000));
    const pts = weights.filter((w) => !cutoff || w.day >= cutoff);
    const avg = movingAverage(pts.map((p) => p.kg), 7);
    return pts.map((p, i) => ({ day: p.day, label: fmtShort(p.day), kg: p.kg, avg: avg[i] !== null ? round(avg[i]!, 2) : null }));
  }, [weights, range]);

  const first = weights[0];
  const delta = latest && first ? latest.kg - first.kg : 0;
  const toGoal = latest ? goals.targetWeight - latest.kg : 0;
  const trend = weeklyTrend(weights.slice(-28).map((w) => ({ x: daysBetween(weights[0]?.day ?? w.day, w.day), y: w.kg })));
  const bmi = latest ? latest.kg / (profile.heightCm / 100) ** 2 : null;
  const weighedDays = new Set(weights.map((w) => w.day));
  let weighStreak = 0;
  for (let d = todayKey(); weighedDays.has(d); d = dayKey(new Date(fromKey(d).getTime() - 86400000))) weighStreak++;

  const save = () => {
    logWeight(day, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const domain = React.useMemo(() => {
    if (!data.length) return [60, 100];
    const vals = data.map((d) => d.kg);
    const min = Math.min(...vals, goals.targetWeight), max = Math.max(...vals, goals.targetWeight);
    return [Math.floor(min - 1), Math.ceil(max + 1)];
  }, [data, goals.targetWeight]);

  return (
    <div>
      <PageHeader title="Gewicht" subtitle={latest ? `Laatst: ${latest.kg.toLocaleString("nl-BE")} kg op ${fmtShort(latest.day)}` : "Nog geen metingen"} />

      <Section>
        <WeeklyDatePicker date={fromKey(day)} setDate={(d) => setDay(dayKey(d))} markers={markers} maxDate={new Date()} />
      </Section>

      <Section>
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold capitalize text-muted-foreground">{existing ? `Meting van ${fmtDay(day, "EEEE d MMM")}` : `Weeg je op ${fmtDay(day, "EEEE d MMM")}`}</p>
          <NumberStepper value={value} onChange={setValue} step={0.1} min={30} max={300} unit="kg" size="lg" />
          <div className="mt-3 flex gap-2">
            {existing && (
              <Button variant="outline" size="lg" onClick={() => removeWeight(day)} aria-label="Verwijder meting">
                <Trash2 className="size-4" />
              </Button>
            )}
            <Button size="lg" className={cn("flex-1", saved && "bg-primary/80")} onClick={save}>
              {saved ? <Check className="size-5" /> : <Scale className="size-5" />}
              {saved ? "Opgeslagen" : existing ? "Meting bijwerken" : "Opslaan (+25 XP)"}
            </Button>
          </div>
        </Card>
      </Section>

      <Section title="Verloop" action={<AnimatedTabs<Range> variant="pill" activeTab={range} onChange={setRange} tabs={[{ id: "30", label: "30d" }, { id: "90", label: "90d" }, { id: "365", label: "1j" }, { id: "all", label: "Alles" }]} className="text-xs [&_button]:px-2.5 [&_button]:py-1" />}>
        <Card className="p-3 pt-4">
          {data.length < 2 ? (
            <EmptyState icon="📉" title="Nog te weinig metingen" desc="Weeg je een paar dagen na elkaar en de grafiek verschijnt hier." />
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis domain={domain} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "var(--muted-foreground)" }}
                    formatter={(v, name) => [`${v ?? ""} kg`, name === "avg" ? "7-daags gem." : "Gewicht"]}
                  />
                  <ReferenceLine y={goals.targetWeight} stroke="var(--primary)" strokeDasharray="4 4" label={{ value: "doel", position: "insideTopRight", fontSize: 10, fill: "var(--primary)" }} />
                  <Area type="monotone" dataKey="kg" stroke="var(--chart-4)" strokeWidth={2} fill="url(#wfill)" dot={data.length < 40 ? { r: 3, fill: "var(--chart-4)", strokeWidth: 0 } : false} isAnimationActive />
                  <Line type="monotone" dataKey="avg" stroke="var(--foreground)" strokeWidth={1.5} dot={false} strokeOpacity={0.7} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>

      <Section title="Statistieken">
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Huidig" value={latest?.kg ?? 0} unit="kg" decimals={1} change={weights.length > 1 ? delta : undefined} changeDescription="sinds start" higherIsBetter={profile.goalType === "bulk"} />
          <StatCard title="Nog tot doel" value={Math.abs(toGoal)} unit="kg" decimals={1} change={trend !== null ? round(trend, 2) : undefined} changeDescription="per week (trend)" higherIsBetter={profile.goalType === "bulk"} />
          <StatCard title="BMI" value={bmi ?? 0} decimals={1} />
          <StatCard title="Weegstreak" value={weighStreak} unit="dagen" />
        </div>
      </Section>

      {weights.length > 0 && (
        <Section title="Recente metingen">
          <Card className="divide-y divide-border">
            {[...weights]
              .reverse()
              .slice(0, 10)
              .map((w, i, arr) => {
                const prev = arr[i + 1];
                const d = prev ? w.kg - prev.kg : 0;
                return (
                  <div key={w.day} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="capitalize text-muted-foreground">{fmtDay(w.day, "EEE d MMM")}</span>
                    <div className="flex items-center gap-3">
                      {prev && <span className={cn("text-xs tabular-nums", d <= 0 ? "text-primary" : "text-chart-5")}>{d > 0 ? "+" : ""}{d.toFixed(1)}</span>}
                      <span className="font-bold tabular-nums">{w.kg.toLocaleString("nl-BE", { minimumFractionDigits: 1 })} kg</span>
                    </div>
                  </div>
                );
              })}
          </Card>
        </Section>
      )}
    </div>
  );
}
