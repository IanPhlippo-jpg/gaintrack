/**
 * Je diertje en de winkel: eten en verzorging geef je meteen, accessoires, kleuren, achtergronden en
 * profielitems koop je één keer en blijven van jou. Betalen gebeurt met coins (zie lib/shop.ts).
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coins, Pencil, Sparkles } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PetAvatar, PetScene } from "@/components/pet/PetAvatar";
import { useStore } from "@/store/useStore";
import { coinBalance } from "@/lib/stats";
import { moodOf, petNeed, petNow, PET_COLORS, SHOP, stageOf, isConsumable, type Pet, type PetStat, type ShopCat, type ShopItem } from "@/lib/shop";
import { useChooseCosmetic } from "@/screens/RewardsDrawer";
import { cn } from "@/lib/utils";

/** Herrekent elke minuut zodat honger en humeur live meezakken. */
export function useNow(ms = 60_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

export function usePet() {
  const raw = useStore((s) => s.pet);
  const now = useNow();
  return raw ? petNow(raw, now) : null;
}

const STAT_LABEL: Record<PetStat, string> = { food: "Eten", clean: "Verzorging", fun: "Plezier" };
const STAT_COLOR: Record<PetStat, string> = { food: "bg-[#FFB38A]", clean: "bg-[#8FC7FF]", fun: "bg-[#F28AB2]" };

export function StatBar({ stat, value, compact }: { stat: PetStat; value: number; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <div className={cn("flex items-baseline justify-between", compact ? "text-[10px]" : "text-xs")}>
        <span className="truncate font-semibold text-muted-foreground">{compact && stat === "clean" ? "Zorg" : STAT_LABEL[stat]}</span>
        {!compact && <span className="tabular-nums text-muted-foreground">{Math.round(value)}%</span>}
      </div>
      <div className={cn("mt-1 overflow-hidden rounded-full bg-muted", compact ? "h-1.5" : "h-2")}>
        <div className={cn("h-full rounded-full transition-[width] duration-500", value < 20 ? "bg-destructive" : STAT_COLOR[stat])} style={{ width: `${Math.max(3, value)}%` }} />
      </div>
    </div>
  );
}

export function CoinPill({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#E8C462]/15 px-2 py-0.5 text-xs font-bold tabular-nums text-[#E8C462]", className)}>
      <Coins className="size-3.5" /> {amount.toLocaleString("nl-BE")}
    </span>
  );
}

const TABS: { id: ShopCat; label: string }[] = [
  { id: "eten", label: "Eten" },
  { id: "verzorging", label: "Verzorging" },
  { id: "accessoire", label: "Accessoires" },
  { id: "stijl", label: "Stijl" },
  { id: "profiel", label: "Profiel" },
];

const EFFECT_LABEL: Record<string, string> = { food: "eten", clean: "verzorging", fun: "plezier", growth: "groei" };

function Adopt() {
  const adopt = useStore((s) => s.adoptPet);
  const [name, setName] = React.useState("Gainy");
  const preview: Pet = { name, color: "lila", growth: 0, food: 80, clean: 80, fun: 80, updatedAt: 0, createdAt: 0, equipped: {} };
  return (
    <div className="space-y-4">
      <PetScene pet={preview} mood="blij" className="py-4" />
      <div>
        <p className="text-sm font-semibold">Geef je diertje een naam</p>
        <p className="mb-2 text-xs text-muted-foreground">Het groeit van baby tot volwassen als je het eten en verzorging geeft. Dat koop je met de coins die je verdient met XP en levels.</p>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} aria-label="Naam van je diertje" />
      </div>
      <Button size="lg" className="w-full" onClick={() => adopt(name)} disabled={!name.trim()}>
        Adopteer {name.trim() || "je diertje"}
      </Button>
    </div>
  );
}

function ItemCard({ item, pet, balance, onGive }: { item: ShopItem; pet: Pet; balance: number; onGive: (i: ShopItem) => void }) {
  const purchases = useStore((s) => s.purchases);
  const cosmetics = useStore((s) => s.cosmetics);
  const buy = useStore((s) => s.buy);
  const equip = useStore((s) => s.equipPet);
  const setStyle = useStore((s) => s.setPetStyle);
  const choose = useChooseCosmetic();
  const [confirm, setConfirm] = React.useState(false);
  React.useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(false), 3500);
    return () => clearTimeout(t);
  }, [confirm]);

  const owned = purchases.includes(item.id);
  const consumable = isConsumable(item);
  const tekort = Math.max(0, item.price - balance);
  // Eten of verzorging heeft geen zin als alles waar het item vooral voor dient al vol zit.
  const main = item.effect ? (Object.entries(item.effect).filter(([k, v]) => k !== "growth" && (v ?? 0) > 0) as [PetStat, number][]) : [];
  const vol = consumable && main.length > 0 && main.every(([k]) => pet[k] >= 95);

  let action: React.ReactNode;
  if (consumable) {
    action = (
      <Button size="sm" className="w-full" disabled={tekort > 0 || vol} onClick={() => buy(item.id) && onGive(item)}>
        {vol ? "Zit vol" : tekort > 0 ? `Nog ${tekort}` : <><Coins className="size-3.5" /> {item.price}</>}
      </Button>
    );
  } else if (!owned) {
    action = (
      <Button size="sm" variant={confirm ? "default" : "secondary"} className="w-full" disabled={tekort > 0} onClick={() => (confirm ? (buy(item.id), setConfirm(false)) : setConfirm(true))}>
        {tekort > 0 ? `Nog ${tekort}` : confirm ? `Koop voor ${item.price}` : <><Coins className="size-3.5" /> {item.price}</>}
      </Button>
    );
  } else if (item.slot) {
    const on = pet.equipped[item.slot] === item.id;
    action = (
      <Button size="sm" variant={on ? "secondary" : "default"} className="w-full" onClick={() => equip(item.slot!, on ? undefined : item.id)}>
        {on ? "Uitdoen" : "Aandoen"}
      </Button>
    );
  } else if (item.petColor || item.petBackground) {
    const on = item.petColor ? pet.color === item.petColor : pet.background === item.petBackground;
    action = (
      <Button size="sm" variant={on ? "secondary" : "default"} className="w-full" onClick={() => setStyle(item.petColor ? { color: on ? "lila" : item.petColor } : { background: on ? undefined : item.petBackground })}>
        {on ? "In gebruik" : "Gebruik"}
      </Button>
    );
  } else if (item.cosmetic) {
    const { kind, value } = item.cosmetic;
    const on = cosmetics[kind] === value;
    action = (
      <Button size="sm" variant={on ? "secondary" : "default"} className="w-full" onClick={() => void choose(kind, on ? undefined : value)}>
        {on ? "Actief" : "Gebruik"}
      </Button>
    );
  }

  return (
    <div className={cn("flex flex-col rounded-2xl border bg-card p-3", owned && "border-primary/40")}>
      <div className="flex items-start gap-2">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-xl" aria-hidden>
          {item.petColor ? <span className="size-5 rounded-full" style={{ background: PET_COLORS[item.petColor].body }} /> : item.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">{item.name}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{item.desc}</p>
        </div>
      </div>
      {item.effect && (
        <div className="mt-2 flex flex-wrap gap-1">
          {Object.entries(item.effect).map(([k, v]) => (
            <span key={k} className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", (v ?? 0) < 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground")}>
              {(v ?? 0) > 0 ? "+" : ""}{v} {EFFECT_LABEL[k]}
            </span>
          ))}
        </div>
      )}
      <div className="mt-auto pt-3">{action}</div>
    </div>
  );
}

function PetHome({ pet }: { pet: Pet }) {
  const balance = useStore((s) => coinBalance(s));
  const rename = useStore((s) => s.renamePet);
  const [tab, setTab] = React.useState<ShopCat>("eten");
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState(pet.name);
  const [pop, setPop] = React.useState<{ id: number; icon: string } | null>(null);
  const mood = moodOf(pet);
  const { stage, next, pct } = stageOf(pet.growth);
  const prevStage = React.useRef(stage.id);
  const celebrate = useStore((s) => s.celebrate);

  React.useEffect(() => {
    if (prevStage.current !== stage.id) celebrate({ title: `${pet.name} is gegroeid!`, subtitle: `Nu: ${stage.name.toLowerCase()}` });
    prevStage.current = stage.id;
  }, [stage.id, stage.name, pet.name, celebrate]);

  const give = (i: ShopItem) => {
    setPop({ id: Date.now(), icon: i.icon });
    try {
      if (useStore.getState().settings.haptics) navigator.vibrate?.(25);
    } catch {
      /* geen trilfunctie */
    }
  };

  return (
    <div className="space-y-4">
      <PetScene pet={pet} mood={mood} className="pt-3">
        <div className="relative">
          <motion.div whileTap={{ scale: 0.94 }} className="mx-auto h-48 w-48">
            <PetAvatar pet={pet} mood={mood} className="size-full" />
          </motion.div>
          <AnimatePresence>
            {pop && (
              <motion.span
                key={pop.id}
                initial={{ opacity: 0, y: 10, scale: 0.6 }}
                animate={{ opacity: 1, y: -40, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                onAnimationComplete={() => setPop(null)}
                className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-3xl"
                aria-hidden
              >
                {pop.icon}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-end justify-between gap-2 px-4 pb-3">
          <div className="min-w-0">
            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); rename(name); setEditing(false); }} className="flex gap-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={16} autoFocus className="h-9 w-40 bg-black/30 text-white" aria-label="Nieuwe naam" />
                <Button size="sm" type="submit">OK</Button>
              </form>
            ) : (
              <button type="button" onClick={() => setEditing(true)} className="flex items-center gap-1.5 text-lg font-extrabold text-white">
                {pet.name} <Pencil className="size-3.5 opacity-70" aria-label="Naam wijzigen" />
              </button>
            )}
            <p className="text-xs text-white/75">{stage.name} · {petNeed(pet)}</p>
          </div>
          <CoinPill amount={balance} className="bg-black/35" />
        </div>
      </PetScene>

      <div className="grid grid-cols-3 gap-3">
        <StatBar stat="food" value={pet.food} />
        <StatBar stat="clean" value={pet.clean} />
        <StatBar stat="fun" value={pet.fun} />
      </div>
      <div className="rounded-2xl bg-muted/60 p-3">
        <div className="flex items-baseline justify-between text-xs">
          <span className="flex items-center gap-1 font-semibold"><Sparkles className="size-3.5 text-primary" /> Groei</span>
          <span className="text-muted-foreground">{next ? `${Math.max(0, next.from - pet.growth)} punten tot ${next.name.toLowerCase()}` : "Volgroeid"}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background/60">
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        {Math.min(pet.food, pet.clean, pet.fun) < 20 && <p className="mt-1.5 text-[11px] text-destructive">Een verwaarloosd diertje groeit maar half zo snel.</p>}
      </div>

      <div className="-mx-5 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-1.5" role="tablist">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("min-h-9 rounded-full px-3.5 text-sm font-semibold", tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "profiel" && <p className="-mt-1 text-xs text-muted-foreground">Ringen en titels zien de anderen in het klassement. Accentkleuren en confetti zie jij in de app.</p>}
      <div className="grid grid-cols-2 gap-2.5">
        {SHOP.filter((i) => i.cat === tab).map((i) => (
          <ItemCard key={i.id} item={i} pet={pet} balance={balance} onGive={give} />
        ))}
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Je verdient 1 coin per 10 XP en bij elk nieuw level 50 × dat level. {pet.name} wordt ook blij van elke training die je afwerkt.</p>
    </div>
  );
}

export function PetDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pet = usePet();
  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()} title={pet ? "Je diertje" : "Adopteer een diertje"} description={pet ? "Eten, verzorging en spullen kopen met je coins." : "Een maatje dat meegroeit met jouw inzet."} full>
      {pet ? <PetHome pet={pet} /> : <Adopt />}
    </Drawer>
  );
}
