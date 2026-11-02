import { motion } from "motion/react";
import * as React from "react";
import { Check, ChevronRight, Droplets, Flame, Gift, Play, Scale, Target, Trophy, Utensils, Zap } from "lucide-react";
import { PageHeader, Section } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { CountUp } from "@/components/ui/count-up";
import { WeeklyBars } from "@/components/ui/weekly-bars";
import { LeaderboardCard } from "@/screens/Leaderboard";
import { RewardsDrawer } from "@/screens/RewardsDrawer";
import { nextUnlock } from "@/lib/unlocks";
import { xpForLevel } from "@/lib/gamification";
import { useStore } from "@/store/useStore";
import { useNav } from "@/App";
import { challengeStatus, currentStreak, dailyGoals, routinesForDay, totalXp, xpOnDay } from "@/lib/stats";
import { levelProgress, levelTitle, motivation } from "@/lib/gamification";
import { fmtDay, shiftKey, todayKey, WEEKDAYS_NL, weekdayOf, weekStartKey } from "@/lib/date";
import { cn } from "@/lib/utils";

export function TodayScreen() {
  const state = useStore();
  const { go } = useNav();
  const today = todayKey();
  const goals = dailyGoals(state, today);
  const doneCount = goals.filter((g) => g.done).length;
  const pct = (doneCount / goals.length) * 100;
  const streak = currentStreak(state);
  const xp = totalXp(state);
  const lp = levelProgress(xp);
  const nextReward = nextUnlock(lp.level);
  const [rewards, setRewards] = React.useState(false);
  const todayXp = xpOnDay(state, today);
  const challenge = challengeStatus(state, today);
  const planned = routinesForDay(state, today);
  const firstName = state.profile.name.split(" ")[0] || "Atleet";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Goeiemorgen" : hour < 18 ? "Goeiemiddag" : "Goeienavond";

  // Huidige week van maandag tot zondag. Een dag zonder enige registratie staat op 0 %;
  // een rustdag telt pas als "gehaald" zodra er die dag iets gelogd is. Toekomstige dagen zijn gedimd.
  const monday = weekStartKey(today);
  const week = Array.from({ length: 7 }, (_, i) => shiftKey(monday, i)).map((d) => {
    const future = d > today;
    const logged = state.foodLog.some((e) => e.day === d) || (state.water[d] ?? 0) > 0 || state.weights.some((w) => w.day === d) || state.workouts.some((w) => w.day === d && w.endedAt);
    const g = dailyGoals(state, d);
    const v = future || !logged ? 0 : (g.filter((x) => x.done).length / g.length) * 100;
    return { day: WEEKDAYS_NL[weekdayOf(d)], value: v, highlight: d === today, muted: future, label: state.perfectDays[d] ? "★" : undefined };
  });

  return (
    <div>
      <PageHeader title={`${greeting}, ${firstName}`} subtitle={fmtDay(today)} />

      {/* Level + XP */}
      <Section>
        <Card className="relative overflow-hidden p-5">
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="flex items-center gap-4">
            <AnimatedCircularProgressBar value={lp.pct} gaugePrimaryColor="var(--primary)" gaugeSecondaryColor="var(--muted)" className="size-24 text-xl" strokeWidth={9}>
              <span className="text-[10px] font-semibold uppercase text-muted-foreground">Level</span>
              <span className="text-2xl font-extrabold leading-none">{lp.level}</span>
            </AnimatedCircularProgressBar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{levelTitle(lp.level)}</p>
              <p className="text-3xl font-extrabold tracking-tight">
                <CountUp to={xp} duration={1} separator="." className="tabular-nums" /> <span className="text-base font-semibold text-muted-foreground">XP</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Nog {(lp.next - xp).toLocaleString("nl-BE")} XP tot level {lp.level + 1}
              </p>
              {nextReward && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Volgende beloning: <span className="font-semibold text-foreground">{nextReward.icon} {nextReward.name}</span> op level {nextReward.level}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                  <Zap className="size-3" /> +{todayXp} vandaag
                </span>
                <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-bold", streak > 0 ? "bg-chart-2/20 text-chart-2" : "bg-muted text-muted-foreground")}>
                  <Flame className="size-3" /> {streak} {streak === 1 ? "dag" : "dagen"} streak
                </span>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => setRewards(true)} className="mt-3 flex w-full items-center justify-between rounded-xl bg-primary/10 px-3 py-2 text-left text-sm">
            <span className="flex items-center gap-2 font-semibold"><Gift className="size-4 text-primary" /> Beloningen</span>
            <span className="text-xs text-muted-foreground">{nextReward ? `nog ${Math.max(0, xpForLevel(nextReward.level) - xp).toLocaleString("nl-BE")} XP tot de volgende` : "alles ontgrendeld"}</span>
          </button>
        </Card>
      </Section>
      <RewardsDrawer open={rewards} onClose={() => setRewards(false)} />

      {/* Dagdoelen */}
      <Section
        title={`Dagdoelen ${doneCount}/${goals.length}`}
        action={<span className="text-xs text-muted-foreground">{motivation(pct, streak)}</span>}
      >
        <Card className="divide-y divide-border">
          {goals.map((g, i) => (
            <motion.button
              key={g.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => go(g.id === "kcal" || g.id === "protein" || g.id === "water" ? "voeding" : g.id === "weight" ? "gewicht" : "training")}
              className="flex w-full items-center gap-3 p-3.5 text-left active:bg-accent/50"
            >
              <AnimatedCircularProgressBar value={g.pct} gaugePrimaryColor={g.done ? "var(--primary)" : "var(--chart-2)"} gaugeSecondaryColor="var(--muted)" className="size-12 text-base" strokeWidth={10}>
                <span className="text-lg leading-none">{g.done ? <Check className="size-5 text-primary" strokeWidth={3} /> : g.icon}</span>
              </AnimatedCircularProgressBar>
              <div className="min-w-0 flex-1">
                <p className={cn("font-semibold", g.done && "text-primary")}>{g.label}</p>
                <p className="truncate text-xs text-muted-foreground">{g.hint}</p>
              </div>
              <div className="text-right">
                {g.unit ? (
                  <p className="text-sm font-bold tabular-nums">
                    {g.value.toLocaleString("nl-BE", { maximumFractionDigits: g.unit === "l" ? 2 : 0 })}
                    <span className="text-xs font-medium text-muted-foreground">/{g.target.toLocaleString("nl-BE", { maximumFractionDigits: g.unit === "l" ? 2 : 0 })} {g.unit}</span>
                  </p>
                ) : (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
              </div>
            </motion.button>
          ))}
        </Card>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => state.addWater(today, 250)}>
            <Droplets className="size-4 text-chart-4" /> +0,25 l water
          </Button>
          <Button variant="secondary" className="flex-1" onClick={() => state.addWater(today, 500)}>
            <Droplets className="size-4 text-chart-4" /> +0,5 l water
          </Button>
        </div>
      </Section>

      {/* Uitdaging */}
      <Section title="Uitdaging van vandaag">
        <Card className={cn("relative overflow-hidden p-4", challenge.done && "border-primary/50")}>
          <div className="pointer-events-none absolute -right-10 -bottom-10 size-32 rounded-full bg-chart-3/20 blur-2xl" />
          <div className="flex items-start gap-3">
            <div className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", challenge.done ? "bg-primary text-primary-foreground" : "bg-chart-3/20 text-chart-3")}>
              {challenge.done ? <Trophy className="size-5" /> : <Target className="size-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{challenge.challenge.title}</p>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold">+{challenge.challenge.xp} XP</span>
              </div>
              <p className="text-sm text-muted-foreground">{challenge.challenge.desc}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className={cn("h-full rounded-full transition-[width] duration-700", challenge.done ? "bg-primary" : "bg-chart-3")} style={{ width: `${Math.min(100, (challenge.progress / challenge.challenge.target) * 100)}%` }} />
              </div>
              <p className="mt-1 text-[11px] tabular-nums text-muted-foreground">
                {challenge.done ? "Gehaald!" : `${Math.round(challenge.progress).toLocaleString("nl-BE")} / ${challenge.challenge.target.toLocaleString("nl-BE")}`}
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* Snelle acties */}
      <Section title="Snel starten">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => go("training")} className="flex flex-col items-start gap-2 rounded-2xl bg-primary p-3 text-left text-primary-foreground">
            <Play className="size-5" />
            <div>
              <p className="text-sm font-bold leading-tight">{state.activeWorkout ? "Training hervatten" : planned[0] ? planned[0].name.split(" (")[0] : "Vrije training"}</p>
              <p className="text-[11px] opacity-80">{state.activeWorkout ? "bezig" : planned[0] ? `${planned[0].exercises.length} oefeningen` : "start nu"}</p>
            </div>
          </button>
          <button type="button" onClick={() => go("voeding")} className="flex flex-col items-start gap-2 rounded-2xl border bg-card p-3 text-left">
            <Utensils className="size-5 text-chart-2" />
            <div>
              <p className="text-sm font-bold leading-tight">Maaltijd</p>
              <p className="text-[11px] text-muted-foreground">loggen</p>
            </div>
          </button>
          <button type="button" onClick={() => go("gewicht")} className="flex flex-col items-start gap-2 rounded-2xl border bg-card p-3 text-left">
            <Scale className="size-5 text-chart-4" />
            <div>
              <p className="text-sm font-bold leading-tight">Gewicht</p>
              <p className="text-[11px] text-muted-foreground">ingeven</p>
            </div>
          </button>
        </div>
      </Section>

      {/* Weekoverzicht */}
      <Section title="Deze week" action={<span className="text-xs text-muted-foreground">★ = perfecte dag</span>}>
        <Card className="p-3">
          <WeeklyBars data={week} />
        </Card>
      </Section>

      <Section title="Klassement">
        <LeaderboardCard />
      </Section>
    </div>
  );
}
