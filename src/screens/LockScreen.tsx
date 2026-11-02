/**
 * Toegang per persoon op dit toestel: account kiezen, pincode ingeven of een nieuw account maken met een toegangscode.
 * Het toestel onthoudt het aangemelde account tot je uitlogt.
 */
import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Delete, KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { setActiveAccountId } from "@/store/storage";
import {
  type Account, type CodeCheck, type Registry,
  changePin, checkAccessCode, createAccount, loadRegistry, lockDelayMs, saveRegistry, setActive, updateAccount, verifyPin,
} from "@/lib/accounts";
import { cn } from "@/lib/utils";

type AccountCtx = {
  registry: Registry;
  account: Account | null;
  update: (r: Registry) => void;
  logout: () => Promise<void>;
  changePin: (pin: string) => Promise<void>;
  setPhoto: (photo: string | undefined) => Promise<void>;
};
const EMPTY_REGISTRY: Registry = { accounts: [], activeId: null, adminSecret: null, handedOut: [], usedInvites: [], failedPin: 0, lockedUntil: 0 };
export const AccountContext = React.createContext<AccountCtx>({
  registry: EMPTY_REGISTRY, account: null, update: () => {}, logout: async () => {}, changePin: async () => {}, setPhoto: async () => {},
});
export const useAccount = () => React.useContext(AccountContext);

const logoSrc = `${import.meta.env.BASE_URL}icon-192.png`;

export function PinDots({ length, filled, shake }: { length: number; filled: number; shake?: number }) {
  return (
    <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : undefined} transition={{ duration: 0.45 }} className="flex justify-center gap-4">
      {Array.from({ length }, (_, i) => (
        <span key={i} className={cn("size-4 rounded-full border-2 border-primary transition-colors", i < filled ? "bg-primary" : "bg-transparent")} />
      ))}
    </motion.div>
  );
}

export function PinPad({ onDigit, onBackspace, disabled }: { onDigit: (d: string) => void; onBackspace: () => void; disabled?: boolean }) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];
  return (
    <div className="mx-auto grid w-full max-w-[280px] grid-cols-3 gap-3">
      {keys.map((k, i) =>
        k === "" ? (
          <span key={i} />
        ) : (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => (k === "back" ? onBackspace() : onDigit(k))}
            aria-label={k === "back" ? "Wis cijfer" : k}
            className="grid h-16 place-items-center rounded-2xl border bg-card text-2xl font-semibold text-foreground transition-transform active:scale-95 disabled:opacity-40 short:h-11 short:rounded-xl short:text-xl"
          >
            {k === "back" ? <Delete className="size-6" /> : k}
          </button>
        ),
      )}
    </div>
  );
}

const AVATAR_SIZE = { sm: "size-9 text-sm", md: "size-12 text-lg", lg: "size-16 text-2xl", xl: "size-24 text-4xl" } as const;

/** Ring rond de avatar, ontgrendeld per level (zie lib/unlocks.ts). */
const FRAME_CLASS: Record<string, string> = {
  bronze: "ring-2 ring-[#C98A5A]",
  silver: "ring-2 ring-[#D8D4E6]",
  gold: "ring-2 ring-[#E8C462] shadow-[0_0_14px_rgba(232,196,98,0.7)]",
  diamond: "ring-2 ring-[#8FD3FF] shadow-[0_0_16px_rgba(143,211,255,0.8)]",
  legend: "ring-2 ring-transparent shadow-[0_0_18px_rgba(232,196,98,0.8)]",
};

export function Avatar({ account, size = "md", className }: { account: Pick<Account, "name" | "color" | "photo"> & { frame?: string }; size?: keyof typeof AVATAR_SIZE; className?: string }) {
  const frame = account.frame ? FRAME_CLASS[account.frame] ?? "" : "";
  const inner = account.photo ? (
    <img src={account.photo} alt={account.name} className={cn("shrink-0 rounded-full object-cover", AVATAR_SIZE[size], frame, className)} />
  ) : (
    <span className={cn("grid shrink-0 place-items-center rounded-full font-bold text-white", AVATAR_SIZE[size], frame, className)} style={{ background: account.color }}>
      {account.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
  if (account.frame === "legend") {
    return (
      <span className="relative inline-grid shrink-0 place-items-center rounded-full p-[3px]" style={{ background: "conic-gradient(from 0deg, #E8C462, #F28AB2, #8FD3FF, #7FD6A4, #E8C462)" }}>
        {inner}
      </span>
    );
  }
  return inner;
}

function Header({ title, help }: { title: string; help?: string }) {
  return (
    <div className="text-center">
      <img src={logoSrc} alt="" className="mx-auto mb-4 size-16 rounded-2xl shadow-[0_12px_30px_-10px_rgba(139,124,199,0.8)] short:hidden" />
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {help && <p className="mt-1 text-sm text-muted-foreground">{help}</p>}
    </div>
  );
}

type View = { kind: "pick" } | { kind: "pin"; account: Account } | { kind: "create" };
type ReadyFn = (r: Registry, a: Account) => void;

function LockScreen({ registry, onUpdate, onReady }: { registry: Registry; onUpdate: (r: Registry) => void; onReady: ReadyFn }) {
  const [view, setView] = React.useState<View>(registry.accounts.length ? { kind: "pick" } : { kind: "create" });
  const slide = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.18 } };

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col overflow-y-auto bg-background px-5 pb-8 pt-[calc(env(safe-area-inset-top)+40px)] safe-x short:max-w-2xl short:pb-4 short:pt-3">
      <AnimatePresence mode="wait" initial={false}>
        {view.kind === "pick" && (
          <motion.div key="pick" {...slide} className="flex flex-1 flex-col">
            <Header title="Wie ben jij?" help="Kies je account. Je pincode geef je maar één keer per toestel in." />
            <div className="mt-8 space-y-3">
              {registry.accounts.map((a) => (
                <button key={a.id} type="button" onClick={() => setView({ kind: "pin", account: a })} className="flex w-full items-center gap-4 rounded-2xl border bg-card p-3 text-left transition-transform active:scale-[0.99]">
                  <Avatar account={a} />
                  <span className="flex-1">
                    <span className="block font-semibold">{a.name}</span>
                    <span className="block text-xs text-muted-foreground">{a.isAdmin ? "Beheerder" : "Account op dit toestel"}</span>
                  </span>
                  <ArrowRight className="size-5 text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="mt-auto pt-6">
              <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={() => setView({ kind: "create" })}>
                <UserPlus className="size-4" /> Nieuw account
              </Button>
            </div>
          </motion.div>
        )}
        {view.kind === "pin" && (
          <motion.div key="pin" {...slide} className="flex flex-1 flex-col">
            <PinLogin registry={registry} account={view.account} onUpdate={onUpdate} onBack={() => setView({ kind: "pick" })} onReady={onReady} />
          </motion.div>
        )}
        {view.kind === "create" && (
          <motion.div key="create" {...slide} className="flex flex-1 flex-col">
            <CreateAccount registry={registry} canBack={registry.accounts.length > 0} onBack={() => setView({ kind: "pick" })} onReady={onReady} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PinLogin({ registry, account, onUpdate, onBack, onReady }: { registry: Registry; account: Account; onUpdate: (r: Registry) => void; onBack: () => void; onReady: ReadyFn }) {
  const [pin, setPin] = React.useState("");
  const [shake, setShake] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [now, setNow] = React.useState(Date.now());
  const locked = registry.lockedUntil > now;

  React.useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [locked]);

  const submit = async (value: string) => {
    setBusy(true);
    if (await verifyPin(account, value)) {
      const r = await setActive(registry, account.id);
      await useStore.persist.rehydrate();
      onReady(r, account);
      return;
    }
    const failed = registry.failedPin + 1;
    const r = { ...registry, failedPin: failed, lockedUntil: Date.now() + lockDelayMs(failed) };
    await saveRegistry(r);
    onUpdate(r);
    setNow(Date.now());
    setShake((s) => s + 1);
    setPin("");
    setBusy(false);
  };

  const digit = (d: string) => {
    if (busy || locked || pin.length >= 4) return;
    const v = pin + d;
    setPin(v);
    if (v.length === 4) void submit(v);
  };

  const waitSec = Math.max(0, Math.ceil((registry.lockedUntil - now) / 1000));

  return (
    <>
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1 self-start text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Ander account
      </button>
      <div className="short:flex short:items-center short:gap-8">
      <div className="short:flex-1">
      <div className="flex flex-col items-center text-center">
        <Avatar account={account} size="lg" />
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Hallo {account.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{locked ? `Te veel foute pogingen. Probeer opnieuw over ${waitSec} s.` : "Geef je pincode in."}</p>
      </div>
      <div className="my-8 short:my-4">
        <PinDots length={4} filled={pin.length} shake={shake} />
      </div>
      </div>
      <div className="short:flex-1">
        <PinPad onDigit={digit} onBackspace={() => setPin((p) => p.slice(0, -1))} disabled={busy || locked} />
      </div>
      </div>
    </>
  );
}

type CreateStep = "name" | "code" | "pin" | "confirm";
const CREATE_STEPS: CreateStep[] = ["name", "code", "pin", "confirm"];

function CreateAccount({ registry, canBack, onBack, onReady }: { registry: Registry; canBack: boolean; onBack: () => void; onReady: ReadyFn }) {
  const [step, setStep] = React.useState<CreateStep>("name");
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [check, setCheck] = React.useState<Extract<CodeCheck, { ok: true }> | null>(null);
  const [codeError, setCodeError] = React.useState<string | null>(null);
  const [pin, setPin] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [shake, setShake] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const idx = CREATE_STEPS.indexOf(step);

  const verifyCode = async () => {
    setBusy(true);
    const res = await checkAccessCode(code, registry.usedInvites);
    setBusy(false);
    if (!res.ok) {
      setCodeError("Deze code klopt niet of is al gebruikt. Vraag een toegangscode aan Ian.");
      return;
    }
    setCheck(res);
    setCodeError(null);
    setStep("pin");
  };

  const finish = async (confirmValue: string) => {
    if (!check) return;
    if (confirmValue !== pin) {
      setShake((s) => s + 1);
      setConfirm("");
      return;
    }
    setBusy(true);
    const { registry: r, account } = await createAccount(registry, name, pin, check);
    await useStore.persist.rehydrate();
    onReady(r, account);
  };

  const onDigit = (d: string) => {
    if (busy) return;
    if (step === "pin" && pin.length < 4) {
      const v = pin + d;
      setPin(v);
      if (v.length === 4) setTimeout(() => setStep("confirm"), 150);
    } else if (step === "confirm" && confirm.length < 4) {
      const v = confirm + d;
      setConfirm(v);
      if (v.length === 4) void finish(v);
    }
  };
  const onBackspace = () => (step === "pin" ? setPin((p) => p.slice(0, -1)) : setConfirm((p) => p.slice(0, -1)));

  const back = () => {
    if (step === "name") onBack();
    else if (step === "code") setStep("name");
    else if (step === "pin") { setPin(""); setStep("code"); }
    else { setConfirm(""); setPin(""); setStep("pin"); }
  };

  const codeReady = code.replace(/[^A-Za-z0-9]/g, "").length >= 6;

  return (
    <>
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        {step === "name" && !canBack ? <span /> : (
          <button type="button" onClick={back} className="flex items-center gap-1">
            <ArrowLeft className="size-4" /> Terug
          </button>
        )}
        <span className="tabular-nums">{idx + 1} / {CREATE_STEPS.length}</span>
      </div>

      {step === "name" && (
        <>
          <Header title="Nieuw account" help="GainTrack is persoonlijk: iedereen heeft een eigen account met een eigen pincode." />
          <div className="mt-8 space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Je voornaam</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Voornaam" autoComplete="given-name" className="h-14 text-lg" autoFocus />
          </div>
          <div className="mt-auto pt-6">
            <Button className="h-12 w-full rounded-2xl" disabled={!name.trim()} onClick={() => setStep("code")}>
              Volgende <ArrowRight className="size-4" />
            </Button>
          </div>
        </>
      )}

      {step === "code" && (
        <>
          <Header title="Toegangscode" help="Vraag een toegangscode aan Ian. Hij keurt je aanvraag goed en geeft je de code." />
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3 text-xs">
              <ShieldCheck className="size-5 shrink-0 text-primary" />
              <span>Elke code werkt één keer. Zonder code kun je geen account aanmaken.</span>
            </div>
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setCodeError(null); }}
              placeholder="BV. A7K2PQ"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className={cn("h-14 text-center font-mono text-xl tracking-[0.3em]", codeError && "border-destructive")}
              autoFocus
            />
            {codeError && <p className="text-xs text-destructive">{codeError}</p>}
          </div>
          <div className="mt-auto pt-6">
            <Button className="h-12 w-full rounded-2xl" disabled={!codeReady || busy} onClick={() => void verifyCode()}>
              <KeyRound className="size-4" /> Code controleren
            </Button>
          </div>
        </>
      )}

      {(step === "pin" || step === "confirm") && (
        <div className="short:flex short:items-center short:gap-8">
          <div className="short:flex-1">
          <Header title={step === "pin" ? "Kies een pincode" : "Herhaal je pincode"} help={step === "pin" ? "4 cijfers. Je geeft hem één keer in per toestel." : "Nog eens dezelfde 4 cijfers."} />
          <div className="my-8 short:my-4">
            <PinDots length={4} filled={step === "pin" ? pin.length : confirm.length} shake={shake} />
          </div>
          </div>
          <div className="short:flex-1">
          <PinPad onDigit={onDigit} onBackspace={onBackspace} disabled={busy} />
          {check?.admin && (
            <p className="mt-6 flex items-center justify-center gap-1 text-xs text-primary">
              <Check className="size-3.5" /> Beheersleutel herkend: dit wordt het beheerdersaccount.
            </p>
          )}
          </div>
        </div>
      )}
    </>
  );
}

/** Laadt het accountregister, meldt het onthouden account aan en toont anders het vergrendelscherm. */
export function AccountGate({ children }: { children: React.ReactNode }) {
  const [registry, setRegistry] = React.useState<Registry | null>(null);
  const [account, setAccount] = React.useState<Account | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const r = await loadRegistry();
      const a = r.accounts.find((x) => x.id === r.activeId) ?? null;
      if (a) {
        setActiveAccountId(a.id);
        await useStore.persist.rehydrate();
      }
      if (!alive) return;
      setRegistry(r);
      setAccount(a);
    })();
    return () => { alive = false; };
  }, []);

  const ctx = React.useMemo<AccountCtx>(
    () => ({
      registry: registry ?? EMPTY_REGISTRY,
      account,
      update: (r) => {
        setRegistry(r);
        setAccount((a) => (a ? r.accounts.find((x) => x.id === a.id) ?? a : a));
      },
      logout: async () => {
        if (!registry) return;
        await setActive(registry, null);
        window.location.reload();
      },
      changePin: async (pin) => {
        if (!registry || !account) return;
        setRegistry(await changePin(registry, account.id, pin));
      },
      setPhoto: async (photo) => {
        if (!registry || !account) return;
        const r = await updateAccount(registry, account.id, { photo });
        setRegistry(r);
        setAccount(r.accounts.find((a) => a.id === account.id) ?? account);
      },
    }),
    [registry, account],
  );

  if (!registry) {
    return (
      <div className="grid h-full place-items-center bg-background">
        <img src={logoSrc} alt="GainTrack" className="size-20 animate-pulse rounded-3xl" />
      </div>
    );
  }

  if (!account) {
    return <LockScreen registry={registry} onUpdate={setRegistry} onReady={(r, a) => { setRegistry(r); setAccount(a); }} />;
  }

  return <AccountContext.Provider value={ctx}>{children}</AccountContext.Provider>;
}
