/**
 * Bottom Nav Bar (21st.dev / arunachalam) - pill-navigatie met in/uit-animerend label, gemaakt controlled.
 */
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

const MOBILE_LABEL_WIDTH = 64;

type BottomNavBarProps<T extends string> = {
  items: NavItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
};

export function BottomNavBar<T extends string>({ items, active, onChange, className }: BottomNavBarProps<T>) {
  return (
    <motion.nav
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Hoofdnavigatie"
      className={cn(
        "flex h-[60px] items-center gap-1 rounded-full border border-border bg-card/90 p-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <motion.button
            key={item.id}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "relative flex h-11 min-w-[44px] items-center justify-center rounded-full px-3 transition-colors duration-200",
              isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted",
              "focus:outline-none",
            )}
            onClick={() => onChange(item.id)}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            type="button"
          >
            <Icon size={22} strokeWidth={isActive ? 2.4 : 2} aria-hidden className="transition-colors duration-200" />
            <motion.div
              initial={false}
              animate={{ width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px", opacity: isActive ? 1 : 0, marginLeft: isActive ? "8px" : "0px" }}
              transition={{ width: { type: "spring", stiffness: 350, damping: 32 }, opacity: { duration: 0.19 }, marginLeft: { duration: 0.19 } }}
              className="flex max-w-[64px] items-center overflow-hidden"
            >
              <span className={cn("select-none truncate text-xs font-semibold leading-[1.9]", isActive ? "text-primary" : "opacity-0")} title={item.label}>
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
