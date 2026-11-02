/**
 * Bottom Nav Bar (21st.dev / arunachalam) - pill-navigatie met in/uit-animerend label.
 * Aangepast: controlled, en de actieve pil schuift met een gedeelde layout-animatie naar het gekozen item.
 */
import { LayoutGroup, motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem<T extends string = string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

const MOBILE_LABEL_WIDTH = 64;
const SPRING = { type: "spring" as const, stiffness: 380, damping: 34 };

type BottomNavBarProps<T extends string> = {
  items: NavItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  /** Verticale zijbalk (liggende gsm): alleen iconen, onder elkaar. */
  vertical?: boolean;
};

export function BottomNavBar<T extends string>({ items, active, onChange, className, vertical = false }: BottomNavBarProps<T>) {
  return (
    <LayoutGroup id="bottom-nav">
      <motion.nav
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        role="navigation"
        aria-label="Hoofdnavigatie"
        className={cn(
          "flex items-center gap-1 border border-border bg-card/90 p-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl",
          vertical ? "h-auto flex-col rounded-[28px]" : "h-[60px] rounded-full",
          className,
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <motion.button
              key={item.id}
              layout
              transition={SPRING}
              whileTap={{ scale: 0.95 }}
              className={cn("relative flex h-11 min-w-[44px] items-center justify-center rounded-full px-3 focus:outline-none", isActive ? "text-primary" : "text-muted-foreground")}
              onClick={() => onChange(item.id)}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              type="button"
            >
              {isActive && <motion.span layoutId="bottom-nav-pill" className="absolute inset-0 rounded-full bg-primary/15" transition={SPRING} />}
              <motion.span layout="position" className="relative z-10 flex items-center">
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} aria-hidden className="transition-colors duration-200" />
              </motion.span>
              <motion.div
                initial={false}
                animate={{ width: isActive && !vertical ? `${MOBILE_LABEL_WIDTH}px` : "0px", opacity: isActive && !vertical ? 1 : 0, marginLeft: isActive && !vertical ? "8px" : "0px" }}
                transition={{ width: SPRING, opacity: { duration: 0.18 }, marginLeft: SPRING }}
                className="relative z-10 flex max-w-[64px] items-center overflow-hidden"
              >
                <span className={cn("select-none truncate text-xs font-semibold leading-[1.9]", isActive ? "text-primary" : "opacity-0")} title={item.label}>
                  {item.label}
                </span>
              </motion.div>
            </motion.button>
          );
        })}
      </motion.nav>
    </LayoutGroup>
  );
}

export default BottomNavBar;
