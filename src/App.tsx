import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Dumbbell, Home, Scale, Utensils } from "lucide-react";
import { BottomNavBar, type NavItem } from "@/components/ui/bottom-nav-bar";
import { ConfettiProvider } from "@/components/ui/confetti";
import { CelebrationToast } from "@/components/ui/celebration-toast";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { useGoalEngine } from "@/hooks/useGoalEngine";
import { TodayScreen } from "@/screens/TodayScreen";
import { NutritionScreen } from "@/screens/NutritionScreen";
import { TrainingScreen } from "@/screens/TrainingScreen";
import { WeightScreen } from "@/screens/WeightScreen";
import { StatsScreen } from "@/screens/StatsScreen";
import { Onboarding } from "@/screens/Onboarding";
import { ProfileDrawer } from "@/screens/ProfileDrawer";
import { AccountGate } from "@/screens/LockScreen";
import { useScoreSync } from "@/screens/Leaderboard";
import { ACCENTS, cosmeticAllowed } from "@/lib/unlocks";
import { levelFromXp } from "@/lib/gamification";
import { totalXp } from "@/lib/stats";
import { hasPendingLog, setPendingLog } from "@/lib/push";

// Geopend via een rustmelding (?log=<oefening>.<set>): één keer bij het opstarten lezen en de link opkuisen.
const startLog = new URLSearchParams(location.search).get("log");
if (startLog) {
  setPendingLog(startLog);
  history.replaceState(null, "", location.pathname + location.hash);
}

export type Tab = "vandaag" | "voeding" | "training" | "gewicht" | "stats";

const NAV: NavItem<Tab>[] = [
  { id: "vandaag", label: "Vandaag", icon: Home },
  { id: "voeding", label: "Voeding", icon: Utensils },
  { id: "training", label: "Training", icon: Dumbbell },
  { id: "gewicht", label: "Gewicht", icon: Scale },
  { id: "stats", label: "Stats", icon: BarChart3 },
];

export const NavContext = React.createContext<{ go: (t: Tab) => void; openProfile: () => void }>({ go: () => {}, openProfile: () => {} });
export const useNav = () => React.useContext(NavContext);

/** Liggende gsm (breed en laag): dan zijbalk-navigatie en twee kolommen. */
function useShort() {
  const q = "(orientation: landscape) and (max-height: 520px)";
  const [short, setShort] = React.useState(() => (typeof window !== "undefined" ? window.matchMedia(q).matches : false));
  React.useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setShort(m.matches);
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return short;
}

function Shell() {
  const onboarded = useStore((s) => s.onboarded);
  const activeWorkout = useStore((s) => s.activeWorkout);
  const [tab, setTab] = React.useState<Tab>(() => (hasPendingLog() ? "training" : "vandaag"));
  const [profileOpen, setProfileOpen] = React.useState(false);
  const short = useShort();
  useGoalEngine();
  useScoreSync();
  // Ontgrendelde accentkleur toepassen op de hele app.
  const accent = useStore((s) => s.cosmetics.accent);
  const level = useStore((s) => levelFromXp(totalXp(s)));
  React.useEffect(() => {
    const el = document.documentElement;
    const a = accent && cosmeticAllowed("accent", accent, level) ? ACCENTS[accent] : null;
    for (const v of ["--primary", "--ring", "--chart-1", "--brand", "--primary-foreground"]) el.style.removeProperty(v);
    if (a) {
      el.style.setProperty("--primary", a.primary);
      el.style.setProperty("--ring", a.primary);
      el.style.setProperty("--chart-1", a.primary);
      el.style.setProperty("--brand", a.primary);
      el.style.setProperty("--primary-foreground", a.foreground);
    }
  }, [accent, level]);

  // Tik op een rustmelding terwijl de app al open staat: de service worker stuurt de link door.
  React.useEffect(() => {
    const open = (href: string) => {
      const log = new URL(href, location.href).searchParams.get("log");
      if (!log) return;
      setTab("training");
      setPendingLog(log);
    };
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "gt-log" && typeof e.data.url === "string") open(e.data.url);
    };
    navigator.serviceWorker?.addEventListener("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener("message", onMsg);
  }, []);

  const nav = React.useMemo(() => ({ go: setTab, openProfile: () => setProfileOpen(true) }), []);

  if (!onboarded) return <Onboarding />;

  const hideNav = tab === "training" && !!activeWorkout;

  return (
    <NavContext.Provider value={nav}>
      <div className="relative mx-auto flex h-full w-full max-w-md flex-col bg-background safe-x short:max-w-none short:flex-row">
        {short && !hideNav && (
          <aside className="flex w-[84px] shrink-0 flex-col items-center justify-center border-r border-border bg-background">
            <BottomNavBar items={NAV} active={tab} onChange={setTab} vertical />
          </aside>
        )}
        <main className="flex-1 overflow-y-auto overscroll-contain safe-top">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className={cn(hideNav ? "min-h-full pb-6" : "min-h-full safe-bottom", "short:mx-auto short:max-w-3xl")}>
              {tab === "vandaag" && <TodayScreen />}
              {tab === "voeding" && <NutritionScreen />}
              {tab === "training" && <TrainingScreen />}
              {tab === "gewicht" && <WeightScreen />}
              {tab === "stats" && <StatsScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
        {!hideNav && !short && (
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+12px)]">
            <div className="pointer-events-auto">
              <BottomNavBar items={NAV} active={tab} onChange={setTab} />
            </div>
          </div>
        )}
        <ProfileDrawer open={profileOpen} onOpenChange={setProfileOpen} />
        <CelebrationToast />
      </div>
    </NavContext.Provider>
  );
}

export default function App() {
  return (
    <ConfettiProvider>
      <AccountGate>
        <Shell />
      </AccountGate>
    </ConfettiProvider>
  );
}
