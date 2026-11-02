/**
 * Achievement badge (21st.dev / trophyso) - badge met vergrendelde/ontgrendelde staat en voortgangsring.
 */
import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserAchievement {
  id: string;
  name: string;
  desc?: string;
  icon?: string;
  achievedAt: string | null;
  progress?: number;
}

interface AchievementBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  achievement: UserAchievement;
  badgeSize?: "sm" | "default" | "lg";
  onAchievementClick?: (a: UserAchievement) => void;
}

const badgeSizeMap = { sm: "h-12 w-12 text-2xl", default: "h-16 w-16 text-3xl", lg: "h-20 w-20 text-4xl" } as const;
const ringSizeMap = { sm: 60, default: 76, lg: 92 } as const;

const AchievementBadge = React.forwardRef<HTMLDivElement, AchievementBadgeProps>(({ className, achievement, badgeSize = "default", onAchievementClick, ...props }, ref) => {
  const isUnlocked = achievement.achievedAt !== null;
  const hasProgress = !isUnlocked && typeof achievement.progress === "number" && achievement.progress > 0;
  const progress = Math.min(100, Math.max(0, achievement.progress ?? 0));
  const ringSize = ringSizeMap[badgeSize];
  const stroke = 3;
  const r = (ringSize - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <div
      ref={ref}
      role={onAchievementClick ? "button" : "listitem"}
      tabIndex={onAchievementClick ? 0 : undefined}
      onClick={() => onAchievementClick?.(achievement)}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-3 text-center transition-colors",
        onAchievementClick && "cursor-pointer active:bg-accent",
        !isUnlocked && "opacity-70",
        className,
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
        {hasProgress && (
          <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
            <circle cx={ringSize / 2} cy={ringSize / 2} r={r} fill="none" stroke="var(--primary)" strokeLinecap="round" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={offset} transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`} />
          </svg>
        )}
        <div
          aria-hidden
          className={cn(
            badgeSizeMap[badgeSize],
            "relative z-10 flex items-center justify-center rounded-full",
            isUnlocked ? "bg-primary/15 shadow-[0_0_24px_-6px_color-mix(in_oklch,var(--primary)_70%,transparent)]" : "bg-muted grayscale",
          )}
        >
          {isUnlocked ? <span>{achievement.icon ?? "🏆"}</span> : <Lock className="size-5 text-muted-foreground" />}
        </div>
      </div>
      <span className={cn("text-xs font-bold leading-tight", !isUnlocked && "text-muted-foreground")}>{achievement.name}</span>
      {achievement.desc && <span className="text-[10px] leading-tight text-muted-foreground">{achievement.desc}</span>}
    </div>
  );
});
AchievementBadge.displayName = "AchievementBadge";

export { AchievementBadge };
