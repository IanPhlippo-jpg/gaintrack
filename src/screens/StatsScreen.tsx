import * as React from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Dumbbell } from "lucide-react";
import { PageHeader, Section, EmptyState } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { HealthStatCard } from "@/components/ui/health-stat-card";
import { CalendarHeatmap } from "@/components/ui/calendar-heatmap";
import { AchievementBadge } from "@/components/ui/achievement-badge";
import { ExerciseMedia } from "@/components/ui/exercise-media";
import AnimatedTabs from "@/components/ui/animated-tabs";
import { useStore } from "@/store/useStore";
import { achievementProgress } from "@/hooks/useGoalEngine";
import { ACHIEVEMENTS, levelProgress } from "@/lib/gamification";
import { activityHeatmap, currentStreak, dailyGoals, dayNutrition, exerciseById, longestStreak, personalRecords, strengthHistory, totalXp, weeklyVolume } from "@/lib/stats";
import { workoutVolume } from "@/lib/calc";
import { fmtShort, fromKey, lastNDays, todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

type StatsTab = "overzicht" | "kracht" | "voeding" | "badges";

const tooltipStyle = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "var(--muted-foreground)" } };

export function StatsScreen() {
  const [tab, setTab] = React.useState<StatsTab>("overzicht");
  return (
    <div>
      <PageHeader title="Statistieken" subtitle="Jouw persoonlijke vooruitgang" />
      <Section>
        <AnimatedTabs<StatsTab> variant="segment" activeTab={tab} onChange={setTab} tabs={[{ id: "overzicht", label: "Overzicht" }, { id: "kracht", label: "Kracht" }, { id: "voeding", label: "Voeding" }, { id: "badges", label: "Badges" }]} />
      </Section>
      {tab === "overzicht" && <Overview />}
      {tab === "kracht" && <Strength />}
      {tab === "voeding" && <Nutrition />}
      {tab === "badges" && <Badges />}
    </div>
  );
}

function Overview() {
  const state = useStore();
  const xp = totalXp(state);
  const lp = levelProgress(xp);
  const streak = currentStreak(state);
  const longest = longestStreak(state);
  const week = lastNDays(7);
  const prevWeek = lastNDays(14).slice(0, 7);
  const wk = state.workouts.filter((w) => week.includes(w.day));
  const pwk = state.workouts.filter((w) => prevWeek.includes(w.day));
  const vol = wk.reduce((a, w) => a + workoutVolume(w), 0);
  const pvol = pwk.reduce((a, w) => a + workoutVolume(w), 0);
  const perfect = week.filter((d) => state.perfectDays[d]).length;
  const pperfect = prevWeek.filter((d) => state.perfectDays[d]).length;
  const totalVolume = state.workouts.reduce((a, w) => a + workoutVolume(w), 0);
  const pct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100));

  const goalHit = ["kcal", "protein", "water", "weight", "workout"].map((id) => {
    const hits = week.filter((d) => dailyGoals(state, d).find((g) => g.id === id)?.done).length;
    return { id, value: (hits / 7) * 100, hits };
  });
  const labels: Record<string, [string, string]> = {
    kcal: ["Calorieën", "var(--chart-2)"],
    protein: ["Eiwit", "var(--chart-1)"],
    water: ["Water", "var(--chart-4)"],
    weight: ["Gewogen", "var(--chart-3)"],
    workout: ["Training", "var(--chart-5)"],
  };
  const heat = activityHeatmap(state, 365).map((d) => ({ t: fromKey(d.day).getTime(), value: d.value, perfect: d.perfect }));
  const weekly = weeklyVolume(state, 8);

  return (
    <>
      <Section>
        <HealthStatCard
          headerIcon={<Activity className="size-5" />}
          title="Deze week"
          stats={[
            { title: "Trainingen", value: wk.length, unit: `/${state.goals.weeklyWorkouts}`, changePercent: pct(wk.length, pwk.length), changeDirection: wk.length >= pwk.length ? "up" : "down" },
            { title: "Volume", value: vol >= 1000 ? `${(vol / 1000).toFixed(1)}t` : Math.round(vol), unit: vol >= 1000 ? "" : "kg", changePercent: pct(vol, pvol), changeDirection: vol >= pvol ? "up" : "down" },
            { title: "Perfecte dagen", value: perfect, unit: "/7", changePercent: pct(perfect, pperfect), changeDirection: perfect >= pperfect ? "up" : "down" },
          ]}
          graphData={goalHit.map((g) => ({ label: labels[g.id][0], value: g.value, color: labels[g.id][1], description: `${g.hits} van 7 dagen gehaald` }))}
          graphHeight={110}
          legendTitle="Dagdoelen gehaald (laatste 7 dagen)"
        />
      </Section>

      <Section title="Activiteit">
        <Card className="p-4">
          <CalendarHeatmap data={heat} label="XP" streaks={{ current: streak, longest }} />
        </Card>
      </Section>

      <Section title="Trainingsvolume per week">
        <Card className="p-3 pt-4">
          {weekly.every((w) => w.volume === 0) ? (
            <EmptyState icon="🏋️" title="Nog geen trainingen" desc="Werk een training af en je volume verschijnt hier." />
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}t` : String(v))} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, _n, item) => {
                      const p = item.payload as { workouts?: number; sets?: number } | undefined;
                      return [`${Number(v ?? 0).toLocaleString("nl-BE")} kg · ${p?.workouts ?? 0} trainingen · ${p?.sets ?? 0} sets`, "Volume"];
                    }}
                    cursor={{ fill: "var(--accent)" }}
                  />
                  <Bar dataKey="volume" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>

      <Section title="Totalen">
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Totaal XP" value={xp} change={undefined} />
          <StatCard title="Level" value={lp.level} />
          <StatCard title="Trainingen" value={state.workouts.length} />
          <StatCard title="Totaal getild" value={totalVolume >= 10000 ? Math.round(totalVolume / 1000) : totalVolume} unit={totalVolume >= 10000 ? "ton" : "kg"} />
          <StatCard title="Langste streak" value={longest} unit="dagen" />
          <StatCard title="Maaltijden gelogd" value={state.foodLog.length} />
        </div>
      </Section>
    </>
  );
}

function Strength() {
  const state = useStore();
  const prs = personalRecords(state);
  const ids = Object.keys(prs).sort((a, b) => prs[b].e1rm - prs[a].e1rm);
  const [sel, setSel] = React.useState<string | null>(null);
  const active = sel ?? ids[0] ?? null;
  const ex = active ? exerciseById(state, active) : null;
  const history = active ? strengthHistory(state, active).map((h) => ({ ...h, label: fmtShort(h.day) })) : [];
  const firstE = history[0]?.e1rm ?? 0;
  const lastE = history[history.length - 1]?.e1rm ?? 0;

  if (!ids.length)
    return (
      <Section>
        <EmptyState icon="📈" title="Nog geen krachtdata" desc="Rond een training af met gewicht en herhalingen, dan zie je hier je geschatte 1RM per oefening." />
      </Section>
    );

  return (
    <>
      <Section>
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
          {ids.map((id) => {
            const e = exerciseById(state, id);
            return (
              <button key={id} type="button" onClick={() => setSel(id)} className={cn("flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-xs font-semibold", active === id ? "border-primary bg-primary/10 text-primary" : "bg-card")}>
                {e && <ExerciseMedia exercise={e} size="thumb" className="h-7 w-7 rounded-full" showLabels={false} />}
                {e?.name ?? id}
              </button>
            );
          })}
        </div>
      </Section>
      {ex && (
        <Section>
          <Card className="overflow-hidden">
            <ExerciseMedia exercise={ex} size="card" className="rounded-none" />
            <div className="grid grid-cols-3 divide-x divide-border border-t text-center">
              <div className="p-3">
                <p className="text-lg font-bold tabular-nums">{Math.round(prs[active!].e1rm)}</p>
                <p className="text-[11px] text-muted-foreground">Geschatte 1RM (kg)</p>
              </div>
              <div className="p-3">
                <p className="text-lg font-bold tabular-nums">
                  {prs[active!].set.weight}×{prs[active!].set.reps}
                </p>
                <p className="text-[11px] text-muted-foreground">Beste set</p>
              </div>
              <div className="p-3">
                <p className={cn("text-lg font-bold tabular-nums", lastE >= firstE ? "text-primary" : "text-chart-5")}>
                  {lastE - firstE >= 0 ? "+" : ""}
                  {Math.round(lastE - firstE)}
                </p>
                <p className="text-[11px] text-muted-foreground">kg sinds start</p>
              </div>
            </div>
          </Card>
        </Section>
      )}
      <Section title="Geschatte 1RM per training">
        <Card className="p-3 pt-4">
          {history.length < 2 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">Nog één training en je ziet hier een lijn.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis domain={["dataMin - 5", "dataMax + 5"]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v, _n, item) => {
                      const p = item.payload as { weight?: number; reps?: number } | undefined;
                      return [`${v} kg (${p?.weight}×${p?.reps})`, "e1RM"];
                    }}
                  />
                  <Line type="monotone" dataKey="e1rm" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--primary)", strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>
      <Section title="Alle records">
        <Card className="divide-y divide-border">
          {ids.map((id) => {
            const e = exerciseById(state, id);
            const pr = prs[id];
            return (
              <button key={id} type="button" onClick={() => setSel(id)} className="flex w-full items-center gap-3 p-3 text-left active:bg-accent/50">
                {e ? <ExerciseMedia exercise={e} size="thumb" showLabels={false} className="h-12 w-12" /> : <Dumbbell className="size-5" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{e?.name ?? id}</p>
                  <p className="text-xs text-muted-foreground">
                    {pr.set.weight} kg × {pr.set.reps} · {fmtShort(pr.day)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{Math.round(pr.e1rm)} kg</p>
                  <p className="text-[10px] text-muted-foreground">e1RM</p>
                </div>
              </button>
            );
          })}
        </Card>
      </Section>
    </>
  );
}

function Nutrition() {
  const state = useStore();
  const days = lastNDays(14);
  const data = days.map((d) => {
    const n = dayNutrition(state, d);
    return { day: d, label: fmtShort(d), kcal: Math.round(n.kcal), protein: Math.round(n.protein), carbs: Math.round(n.carbs), fat: Math.round(n.fat) };
  });
  const logged = data.filter((d) => d.kcal > 0);
  const avg = (k: "kcal" | "protein" | "carbs" | "fat") => (logged.length ? Math.round(logged.reduce((a, d) => a + d[k], 0) / logged.length) : 0);
  const proteinHits = data.filter((d) => d.protein >= state.goals.protein).length;
  const kcalHits = data.filter((d) => d.kcal > 0 && Math.abs(d.kcal - state.goals.kcal) <= state.goals.kcal * 0.1).length;

  return (
    <>
      <Section title="Calorieën, laatste 14 dagen">
        <Card className="p-3 pt-4">
          {!logged.length ? (
            <EmptyState icon="🥗" title="Nog geen voeding gelogd" />
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} interval={1} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "var(--accent)" }} formatter={(v) => [`${v} kcal`, "Calorieën"]} />
                  <ReferenceLine y={state.goals.kcal} stroke="var(--primary)" strokeDasharray="4 4" />
                  <Bar dataKey="kcal" radius={[6, 6, 0, 0]} fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </Section>
      <Section title="Gemiddelden (gelogde dagen)">
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Calorieën" value={avg("kcal")} unit="kcal" change={avg("kcal") - state.goals.kcal} changeDescription="t.o.v. doel" higherIsBetter={state.profile.goalType === "bulk"} />
          <StatCard title="Eiwit" value={avg("protein")} unit="g" change={avg("protein") - state.goals.protein} changeDescription="t.o.v. doel" />
          <StatCard title="Koolhydraten" value={avg("carbs")} unit="g" />
          <StatCard title="Vet" value={avg("fat")} unit="g" />
          <StatCard title="Eiwitdoel gehaald" value={proteinHits} unit="/14 dagen" />
          <StatCard title="Kcal binnen 10%" value={kcalHits} unit="/14 dagen" />
        </div>
      </Section>
    </>
  );
}

function Badges() {
  const state = useStore();
  const progress = achievementProgress(state);
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]);
  const locked = ACHIEVEMENTS.filter((a) => !state.achievements[a.id]);
  return (
    <>
      <Section title={`Ontgrendeld ${unlocked.length}/${ACHIEVEMENTS.length}`}>
        {unlocked.length === 0 ? (
          <EmptyState icon="🔒" title="Nog geen badges" desc="Log een maaltijd, weeg je of rond een training af voor je eerste badge." />
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {unlocked.map((a) => (
              <AchievementBadge key={a.id} badgeSize="sm" achievement={{ id: a.id, name: a.name, icon: a.icon, achievedAt: state.achievements[a.id], desc: fmtShort(state.achievements[a.id]) }} />
            ))}
          </div>
        )}
      </Section>
      <Section title="Nog te halen">
        <div className="grid grid-cols-3 gap-2">
          {locked.map((a) => (
            <AchievementBadge key={a.id} badgeSize="sm" achievement={{ id: a.id, name: a.name, icon: a.icon, desc: a.desc, achievedAt: null, progress: Math.round(progress[a.id] * 100) }} />
          ))}
        </div>
      </Section>
      <p className="px-5 pb-4 text-center text-xs text-muted-foreground">Vandaag is {fmtShort(todayKey())}. Streaks tellen enkel perfecte dagen.</p>
    </>
  );
}
