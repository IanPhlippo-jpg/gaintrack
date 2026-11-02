import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import { useConfetti } from "./confetti";

/** Toont het laatste feestmoment (perfecte dag, uitdaging, badge) als zwevende toast met confetti. */
export function CelebrationToast() {
  const celebration = useStore((s) => s.lastCelebration);
  const clear = useStore((s) => s.clearCelebration);
  const fire = useConfetti();
  const lastId = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!celebration || celebration.id === lastId.current) return;
    lastId.current = celebration.id;
    fire({ y: window.innerHeight * 0.3 });
    try {
      navigator.vibrate?.(60);
    } catch {
      /* geen trilfunctie */
    }
    const t = setTimeout(clear, 4200);
    return () => clearTimeout(t);
  }, [celebration, clear, fire]);

  return (
    <AnimatePresence>
      {celebration && (
        <motion.div
          key={celebration.id}
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          onClick={clear}
          className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+12px)] z-[90] mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-[0_20px_60px_-20px_color-mix(in_oklch,var(--primary)_60%,transparent)] backdrop-blur-xl"
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{celebration.title}</p>
            {celebration.subtitle && <p className="truncate text-sm text-muted-foreground">{celebration.subtitle}</p>}
          </div>
          {celebration.xp && <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">+{celebration.xp} XP</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
