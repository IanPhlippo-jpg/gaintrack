/**
 * Animated Tabs (21st.dev / educalvolpz) - tabs met schuivende indicator (underline, pill, segment).
 */
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useId, useState } from "react";

export interface AnimatedTabsProps<T extends string = string> {
  activeTab?: T;
  className?: string;
  defaultTab?: T;
  layoutId?: string;
  onChange?: (tabId: T) => void;
  tabs: { id: T; label: string; icon?: ReactNode }[];
  variant?: "underline" | "pill" | "segment";
}

const SPRING = { bounce: 0.05, duration: 0.25, type: "spring" as const };

export default function AnimatedTabs<T extends string>({ tabs, activeTab: controlled, defaultTab, onChange, variant = "underline", layoutId: customLayoutId, className }: AnimatedTabsProps<T>) {
  const shouldReduceMotion = useReducedMotion();
  const generatedId = useId();
  const layoutId = customLayoutId ?? `animated-tabs-${generatedId}`;
  const [internal, setInternal] = useState<T>(defaultTab ?? tabs[0]?.id);
  const isControlled = controlled !== undefined;
  const activeTab = isControlled ? controlled : internal;

  const handleTabChange = useCallback(
    (tabId: T) => {
      if (!isControlled) setInternal(tabId);
      onChange?.(tabId);
    },
    [isControlled, onChange],
  );

  const containerStyles = cn(
    "relative inline-flex",
    variant === "underline" && "gap-1 border-b border-border",
    variant === "pill" && "gap-1 rounded-full bg-muted p-1",
    variant === "segment" && "w-full gap-0 rounded-xl bg-muted p-1",
  );

  const tabStyles = (isActive: boolean) =>
    cn(
      "relative z-10 flex cursor-pointer items-center justify-center gap-2 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none",
      variant === "underline" && ["rounded-t-md", isActive ? "text-foreground" : "text-muted-foreground"],
      variant === "pill" && ["rounded-full", isActive ? "text-foreground" : "text-muted-foreground"],
      variant === "segment" && ["flex-1 rounded-lg", isActive ? "text-foreground" : "text-muted-foreground"],
    );

  const indicatorStyles = cn(
    "absolute",
    variant === "underline" && "right-0 -bottom-px left-0 h-0.5 bg-primary",
    variant === "pill" && "inset-0 rounded-full border border-border bg-background shadow-sm",
    variant === "segment" && "inset-0 rounded-lg border border-border bg-card shadow-sm",
  );

  return (
    <div aria-label="Tabs" className={cn(containerStyles, className)} role="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button aria-selected={isActive} className={tabStyles(isActive)} id={`${layoutId}-tab-${tab.id}`} key={tab.id} onClick={() => handleTabChange(tab.id)} role="tab" tabIndex={isActive ? 0 : -1} type="button">
            {isActive && <motion.span className={indicatorStyles} layout layoutId={layoutId} style={{ originY: "0px" }} transition={shouldReduceMotion ? { duration: 0 } : SPRING} />}
            {tab.icon ? <span className="relative z-10">{tab.icon}</span> : null}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
