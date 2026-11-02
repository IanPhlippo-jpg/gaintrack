import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { BarChart3, Dumbbell, Home, Scale, Utensils } from "lucide-react";
import { BottomNavBar, type NavItem } from "@/components/ui/bottom-nav-bar";
import { ConfettiProvider } from "@/components/ui/confetti";
import { CelebrationToast } from "@/components/ui/celebration-toast";
import { useStore } from "@/store/useStore";
import { useGoalEngine } from "@/hooks/useGoalEngine";
import { TodayScreen } from "@/screens/TodayScreen";
import { NutritionScreen } from "@/screens/NutritionScreen";
import { TrainingScreen } from "@/screens/TrainingScreen";
import { WeightScreen } from "@/screens/WeightScreen";
import { StatsScreen } from "@/screens/StatsScreen";
import { Onboarding } from "@/screens/Onboarding";
import { ProfileDrawer } from "@/screens/ProfileDrawer";

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

function Shell() {
  const onboarded = useStore((s) => s.onboarded);
  const activeWorkout = useStore((s) => s.activeWorkout);
  const [tab, setTab] = React.useState<Tab>("vandaag");
  const [profileOpen, setProfileOpen] = React.useState(false);
  useGoalEngine();

  const nav = React.useMemo(() => ({ go: setTab, openProfile: () => setProfileOpen(true) }), []);

  if (!onboarded) return <Onboarding />;

  const hideNav = tab === "training" && !!activeWorkout;

  return (
    <NavContext.Provider value={nav}>
      <div className="relative mx-auto flex h-full w-full max-w-md flex-col bg-background">
        <main className="flex-1 overflow-y-auto overscroll-contain safe-top">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className={hideNav ? "min-h-full pb-6" : "min-h-full safe-bottom"}>
              {tab === "vandaag" && <TodayScreen />}
              {tab === "voeding" && <NutritionScreen />}
              {tab === "training" && <TrainingScreen />}
              {tab === "gewicht" && <WeightScreen />}
              {tab === "stats" && <StatsScreen />}
            </motion.div>
          </AnimatePresence>
        </main>
        {!hideNav && (
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
      <Shell />
    </ConfettiProvider>
  );
}
