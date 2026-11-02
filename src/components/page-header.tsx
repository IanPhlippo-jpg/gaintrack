import type * as React from "react";
import { User } from "lucide-react";
import { useNav } from "@/App";
import { useStore } from "@/store/useStore";
import { levelProgress } from "@/lib/gamification";
import { totalXp } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Avatar, useAccount } from "@/screens/LockScreen";

export function PageHeader({ title, subtitle, right, className }: { title: string; subtitle?: string; right?: React.ReactNode; className?: string }) {
  const { openProfile } = useNav();
  const xp = useStore((s) => totalXp(s));
  const lp = levelProgress(xp);
  const { account } = useAccount();
  return (
    <header className={cn("flex items-center justify-between gap-3 px-5 pb-3 pt-4", className)}>
      <div className="min-w-0">
        {subtitle && <p className="truncate text-xs font-medium text-muted-foreground first-letter:uppercase">{subtitle}</p>}
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {right}
        <button type="button" onClick={openProfile} aria-label="Profiel en doelen" className="relative grid size-11 place-items-center overflow-visible rounded-full border border-border bg-card text-foreground">
          {account?.photo ? <Avatar account={account} size="md" className="size-[42px]" /> : <User className="size-5" />}
          <span className="absolute -bottom-1 -right-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">{lp.level}</span>
        </button>
      </div>
    </header>
  );
}

export function Section({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("px-5 pb-4", className)}>
      {(title || action) && (
        <div className="mb-2.5 flex items-center justify-between">
          {title && <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed p-8 text-center">
      <div className="text-3xl">{icon}</div>
      <p className="font-semibold">{title}</p>
      {desc && <p className="text-sm text-muted-foreground">{desc}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
