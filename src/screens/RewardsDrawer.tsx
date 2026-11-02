/**
 * Beloningen: wat je per level ontgrendelt, wat je al hebt en wat je nu gebruikt (ring, accentkleur, titel, confetti).
 */
import { Check, Lock, Sparkles } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { useStore } from "@/store/useStore";
import { useAccount, Avatar } from "@/screens/LockScreen";
import { levelProgress, levelTitle, xpForLevel } from "@/lib/gamification";
import { ACCENTS, UNLOCKS, nextUnlock, type Unlock } from "@/lib/unlocks";
import { totalXp } from "@/lib/stats";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<Unlock["kind"], string> = { frame: "Avatar-ring", accent: "Accentkleur", title: "Titel", confetti: "Confetti", perk: "Voordeel" };

export function useChooseCosmetic() {
  const setCosmetics = useStore((s) => s.setCosmetics);
  const { account, registry, update } = useAccount();
  return async (kind: Unlock["kind"], value: string | undefined) => {
    if (kind === "perk") return;
    setCosmetics({ [kind]: value });
    // Ring en titel ook in het accountregister (zichtbaar op het inlogscherm) en zo naar het klassement.
    if ((kind === "frame" || kind === "title") && account) {
      const { updateAccount } = await import("@/lib/accounts");
      update(await updateAccount(registry, account.id, { [kind]: value }));
    }
  };
}

export function RewardsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const xp = useStore((s) => totalXp(s));
  const cosmetics = useStore((s) => s.cosmetics);
  const { account } = useAccount();
  const choose = useChooseCosmetic();
  const lp = levelProgress(xp);
  const next = nextUnlock(lp.level);

  const isActive = (u: Unlock) => u.kind !== "perk" && cosmetics[u.kind] === u.value;
  const unlocked = (u: Unlock) => lp.level >= u.level;

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title="Beloningen" description="Elk level ontgrendelt iets. Wat je kiest, zien de anderen ook in het klassement." full>
      <div className="mb-4 flex items-center gap-4 rounded-2xl border bg-card p-4">
        <AnimatedCircularProgressBar value={lp.pct} gaugePrimaryColor="var(--primary)" gaugeSecondaryColor="var(--muted)" className="size-20 text-base" strokeWidth={8}>
          <span className="text-[9px] font-semibold uppercase text-muted-foreground">Level</span>
          <span className="text-xl font-extrabold leading-none">{lp.level}</span>
        </AnimatedCircularProgressBar>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">{levelTitle(lp.level)}</p>
          <p className="text-sm text-muted-foreground">
            {xp.toLocaleString("nl-BE")} XP · nog {(lp.next - xp).toLocaleString("nl-BE")} tot level {lp.level + 1}
          </p>
          {next && (
            <p className="mt-1 flex items-center gap-1 text-xs">
              <Sparkles className="size-3.5 text-primary" /> Volgende: <span className="font-semibold">{next.icon} {next.name}</span> op level {next.level}
            </p>
          )}
        </div>
        {account && <Avatar account={{ ...account, frame: cosmetics.frame }} size="lg" />}
      </div>

      {cosmetics.frame || cosmetics.accent || cosmetics.title || cosmetics.confetti ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {(["frame", "accent", "title", "confetti"] as const).map((k) =>
            cosmetics[k] ? (
              <button key={k} type="button" onClick={() => void choose(k, undefined)} className="flex items-center gap-1 rounded-full border bg-muted px-3 py-1 text-xs">
                {KIND_LABEL[k]}: <span className="font-semibold">{k === "accent" ? ACCENTS[cosmetics[k]!]?.label ?? cosmetics[k] : cosmetics[k]}</span> <span className="text-muted-foreground">· standaard</span>
              </button>
            ) : null,
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        {UNLOCKS.map((u) => {
          const ok = unlocked(u);
          const active = isActive(u);
          return (
            <div key={u.id} className={cn("flex items-center gap-3 rounded-2xl border p-3", ok ? "bg-card" : "bg-card/40 opacity-70", active && "border-primary bg-primary/10")}>
              <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl text-xl", ok ? "bg-primary/15" : "bg-muted")}>{ok ? u.icon : <Lock className="size-4 text-muted-foreground" />}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {u.name} <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">Level {u.level}</span>
                </p>
                <p className="text-xs text-muted-foreground">{u.desc}</p>
                {!ok && <p className="mt-0.5 text-[11px] text-primary">Nog {Math.max(0, xpForLevel(u.level) - xp).toLocaleString("nl-BE")} XP</p>}
                {ok && u.kind === "perk" && <p className="mt-0.5 flex items-center gap-1 text-[11px] text-primary"><Check className="size-3" /> Actief</p>}
              </div>
              {ok && u.kind !== "perk" && (
                <Button size="sm" variant={active ? "secondary" : "default"} onClick={() => void choose(u.kind, active ? undefined : u.value)}>
                  {active ? "Actief" : "Gebruik"}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Drawer>
  );
}
