/**
 * Account-onderdelen in het profiel: aangemeld account, pincode wijzigen, uitloggen,
 * en voor de beheerder de lijst toegangscodes om uit te delen.
 */
import * as React from "react";
import { Check, Copy, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, useAccount } from "@/screens/LockScreen";
import { allInviteCodes, saveRegistry } from "@/lib/accounts";
import { INVITE_COUNT } from "@/lib/invite-secrets";
import { cn } from "@/lib/utils";

function PinInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <Input
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={4}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      placeholder={placeholder}
      className="h-12 text-center text-xl tracking-[0.5em]"
    />
  );
}

export function AccountSection() {
  const { account, logout, changePin } = useAccount();
  const [editPin, setEditPin] = React.useState(false);
  const [p1, setP1] = React.useState("");
  const [p2, setP2] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  if (!account) return null;

  const save = async () => {
    if (p1.length !== 4 || p1 !== p2) return;
    await changePin(p1);
    setP1(""); setP2(""); setEditPin(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <Avatar account={account} />
        <div className="flex-1">
          <p className="font-semibold">{account.name}</p>
          <p className="text-xs text-muted-foreground">{account.isAdmin ? "Beheerder · aangemeld op dit toestel" : "Aangemeld op dit toestel"}</p>
        </div>
        {saved && <span className="flex items-center gap-1 text-xs text-primary"><Check className="size-3.5" /> Opgeslagen</span>}
      </div>

      {editPin ? (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <PinInput value={p1} onChange={setP1} placeholder="Nieuw" />
            <PinInput value={p2} onChange={setP2} placeholder="Herhaal" />
          </div>
          {p2.length === 4 && p1 !== p2 && <p className="text-xs text-destructive">De pincodes zijn niet gelijk.</p>}
          <div className="flex gap-2">
            <Button size="sm" disabled={p1.length !== 4 || p1 !== p2} onClick={() => void save()}>Pincode opslaan</Button>
            <Button size="sm" variant="secondary" onClick={() => { setEditPin(false); setP1(""); setP2(""); }}>Annuleer</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditPin(true)}>
            <KeyRound className="size-4" /> Pincode wijzigen
          </Button>
          {confirmLogout ? (
            <>
              <Button size="sm" variant="destructive" onClick={() => void logout()}>Ja, uitloggen</Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirmLogout(false)}>Annuleer</Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirmLogout(true)}>
              <LogOut className="size-4" /> Uitloggen op dit toestel
            </Button>
          )}
        </div>
      )}
      {confirmLogout && <p className="mt-2 text-xs text-muted-foreground">Je gegevens blijven op dit toestel staan; je logt opnieuw in met je pincode.</p>}
    </div>
  );
}

/** Enkel voor de beheerder: toegangscodes afgeleid van de beheersleutel, af te vinken als uitgedeeld. */
export function AdminSection() {
  const { registry, account, update } = useAccount();
  const [codes, setCodes] = React.useState<string[] | null>(null);
  const [copied, setCopied] = React.useState<number | null>(null);
  const secret = registry.adminSecret;

  React.useEffect(() => {
    if (!secret) return;
    let alive = true;
    void allInviteCodes(secret).then((c) => alive && setCodes(c));
    return () => { alive = false; };
  }, [secret]);

  if (!account?.isAdmin || !secret) return null;

  const toggle = async (i: number) => {
    const handedOut = registry.handedOut.includes(i) ? registry.handedOut.filter((x) => x !== i) : [...registry.handedOut, i];
    const r = { ...registry, handedOut };
    await saveRegistry(r);
    update(r);
  };

  const copy = async (i: number, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* geen klembord beschikbaar */
    }
  };

  const next = codes?.findIndex((_, i) => !registry.handedOut.includes(i + 1)) ?? -1;

  return (
    <div className="rounded-2xl border border-primary/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="size-4 text-primary" /> Beheer · toegangscodes</p>
      <p className="mb-3 mt-1 text-xs text-muted-foreground">
        Wie een account wil, vraagt jou een code. Geef de volgende vrije code door en vink ze af. Elke code werkt één keer per toestel. {registry.handedOut.length} van {INVITE_COUNT} uitgedeeld.
      </p>
      {codes && next >= 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-primary/10 p-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Volgende vrije code</p>
            <p className="font-mono text-2xl font-bold tracking-[0.2em]">{codes[next]}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => void copy(next + 1, codes[next])}>
              {copied === next + 1 ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
            <Button size="sm" onClick={() => void toggle(next + 1)}>Uitgedeeld</Button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {(codes ?? Array.from({ length: INVITE_COUNT }, () => "······")).map((c, i) => {
          const n = i + 1;
          const done = registry.handedOut.includes(n);
          return (
            <button
              key={n}
              type="button"
              onClick={() => void toggle(n)}
              className={cn("flex items-center justify-between rounded-lg border px-2.5 py-1.5 font-mono text-sm", done ? "border-transparent bg-muted text-muted-foreground line-through" : "bg-card")}
            >
              <span className="text-[10px] text-muted-foreground">{String(n).padStart(2, "0")}</span>
              <span className="tracking-wider">{c}</span>
              {done ? <Check className="size-3.5" /> : <span className="size-3.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
