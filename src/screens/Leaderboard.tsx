/**
 * Weekklassement: kaart op het Vandaag-scherm met de top 3 en een paneel met alle accounts op dit toestel,
 * per week te bladeren. Zonder server telt alleen wat op dit toestel staat.
 */
import * as React from "react";
import { ChevronLeft, ChevronRight, Crown, Medal, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { useStore } from "@/store/useStore";
import { Avatar, useAccount } from "@/screens/LockScreen";
import { pushMyWeek, weekLeaderboard, weekStartWithOffset, type WeekScore } from "@/lib/leaderboard";
import { syncEnabled } from "@/lib/sync";
import { fmtShort, shiftKey, todayKey } from "@/lib/date";
import { cn } from "@/lib/utils";

const MEDAL = ["text-[#E8C462]", "text-[#C9C2E3]", "text-[#C98A5A]"];

function useLeaderboard(offset: number) {
  const { registry, account } = useAccount();
  const xpEvents = useStore((s) => s.xpEvents);
  const workouts = useStore((s) => s.workouts);
  const perfectDays = useStore((s) => s.perfectDays);
  const [rows, setRows] = React.useState<WeekScore[] | null>(null);
  const weekStart = weekStartWithOffset(todayKey(), offset);

  React.useEffect(() => {
    if (!account) return;
    let alive = true;
    void weekLeaderboard(registry, { id: account.id, state: { xpEvents, workouts, perfectDays } }, weekStart).then((r) => alive && setRows(r));
    return () => { alive = false; };
  }, [registry, account, xpEvents, workouts, perfectDays, weekStart]);

  return { rows, weekStart };
}

/** Stuurt je eigen weekscore (met vertraging) naar de server zodra er iets verandert. */
export function useScoreSync() {
  const { account } = useAccount();
  const xpEvents = useStore((s) => s.xpEvents);
  const workouts = useStore((s) => s.workouts);
  const perfectDays = useStore((s) => s.perfectDays);
  React.useEffect(() => {
    if (!account || !syncEnabled()) return;
    const t = setTimeout(() => {
      const today = todayKey();
      void pushMyWeek(account, { xpEvents, workouts, perfectDays }, weekStartWithOffset(today, 0));
      // Vorige week ook meesturen, voor wie net na middernacht op maandag nog logt.
      void pushMyWeek(account, { xpEvents, workouts, perfectDays }, weekStartWithOffset(today, 1));
    }, 1500);
    return () => clearTimeout(t);
  }, [account, xpEvents, workouts, perfectDays]);
}

function Row({ row, rank, compact }: { row: WeekScore; rank: number; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl p-2.5", row.isMe ? "bg-primary/15 ring-1 ring-primary/40" : "bg-card", !compact && "border")}>
      <span className={cn("grid w-6 shrink-0 place-items-center text-sm font-bold tabular-nums", rank <= 3 ? MEDAL[rank - 1] : "text-muted-foreground")}>
        {rank === 1 ? <Crown className="size-5" /> : rank <= 3 ? <Medal className="size-5" /> : rank}
      </span>
      <Avatar account={row.account} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">
          {row.account.name} {row.isMe && <span className="text-xs font-normal text-muted-foreground">(jij)</span>}
          {row.remote && <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">andere gsm</span>}
        </p>
        {!compact && (
          <p className="text-xs text-muted-foreground">
            {row.workouts} {row.workouts === 1 ? "training" : "trainingen"} · {row.sets} sets · {row.perfectDays} {row.perfectDays === 1 ? "perfecte dag" : "perfecte dagen"}
          </p>
        )}
      </div>
      <div className="text-right">
        <p className="text-base font-extrabold tabular-nums text-primary">{row.xp.toLocaleString("nl-BE")}</p>
        <p className="-mt-0.5 text-[10px] font-semibold uppercase text-muted-foreground">XP</p>
      </div>
    </div>
  );
}

export function LeaderboardCard() {
  const [open, setOpen] = React.useState(false);
  const { rows } = useLeaderboard(0);
  const top = rows?.slice(0, 3) ?? [];
  const myRank = rows ? rows.findIndex((r) => r.isMe) + 1 : 0;

  return (
    <>
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-bold">Weekklassement</p>
            <p className="text-xs text-muted-foreground">{rows && rows.length > 1 ? `Jij staat ${myRank}e van ${rows.length}` : "Nodig iemand uit met een toegangscode om te strijden"}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
            <Users className="size-4" /> Alles
          </Button>
        </div>
        <div className="space-y-1.5">
          {top.map((r, i) => (
            <Row key={r.account.id} row={r} rank={i + 1} compact />
          ))}
        </div>
      </Card>
      <LeaderboardDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function LeaderboardDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [offset, setOffset] = React.useState(0);
  const { rows, weekStart } = useLeaderboard(offset);
  const weekEnd = shiftKey(weekStart, 6);

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Weekklassement" description="XP van maandag tot zondag. Trainingen, sets en perfecte dagen tellen mee als de XP gelijk staat." full>
      <div className="mb-4 flex items-center justify-between rounded-2xl border bg-card p-2">
        <Button size="sm" variant="ghost" onClick={() => setOffset((o) => o + 1)} aria-label="Vorige week">
          <ChevronLeft className="size-4" />
        </Button>
        <p className="text-sm font-semibold">
          {offset === 0 ? "Deze week" : offset === 1 ? "Vorige week" : `${offset} weken geleden`} <span className="font-normal text-muted-foreground">· {fmtShort(weekStart)} – {fmtShort(weekEnd)}</span>
        </p>
        <Button size="sm" variant="ghost" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 1))} aria-label="Volgende week">
          <ChevronRight className="size-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {rows?.map((r, i) => <Row key={r.account.id} row={r} rank={i + 1} />)}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {syncEnabled() ? "Scores worden gedeeld met alle spelers van GainTrack, ook op andere gsm's." : "Telt voorlopig enkel de accounts op dit toestel; de gedeelde server staat nog niet aan."}
      </p>
    </Drawer>
  );
}
