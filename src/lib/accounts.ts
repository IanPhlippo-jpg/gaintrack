/**
 * Accounts per persoon op dit toestel: naam + pincode, toegangscode nodig om een account aan te maken.
 * De gegevens van elk account staan apart in de store (sleutel gaintrack-v1:<accountId>).
 * Alles wordt lokaal op het toestel bewaard; er is geen server.
 */
import { appStorage, setActiveAccountId } from "@/store/storage";
import { ADMIN_HASH, INVITE_ALPHABET, INVITE_COUNT, INVITE_HASHES } from "@/lib/invite-secrets";
import { uid } from "@/lib/utils";

export type Account = {
  id: string;
  name: string;
  pinHash: string;
  salt: string;
  createdAt: string;
  isAdmin: boolean;
  color: string;
};

export type Registry = {
  accounts: Account[];
  /** Account dat op dit toestel is aangemeld (onthouden tot "Uitloggen"). */
  activeId: string | null;
  /** Beheersleutel, enkel op het toestel van de beheerder bewaard. */
  adminSecret: string | null;
  /** Toegangscodes die de beheerder al heeft uitgedeeld (index 1..N). */
  handedOut: number[];
  /** Codes die op dit toestel al gebruikt zijn (hash). */
  usedInvites: string[];
  failedPin: number;
  lockedUntil: number;
};

export const REGISTRY_KEY = "gaintrack-accounts";
export const LEGACY_DATA_KEY = "gaintrack-v1";
export const ACCOUNT_COLORS = ["#8B7CC7", "#5A3B8C", "#C9C2E3", "#3A3A52", "#2A1E4D"];

const EMPTY: Registry = { accounts: [], activeId: null, adminSecret: null, handedOut: [], usedInvites: [], failedPin: 0, lockedUntil: 0 };

export async function loadRegistry(): Promise<Registry> {
  try {
    const raw = await appStorage.getItem(REGISTRY_KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Registry>) };
  } catch {
    return { ...EMPTY };
  }
}

export async function saveRegistry(r: Registry): Promise<void> {
  await appStorage.setItem(REGISTRY_KEY, JSON.stringify(r));
}

const enc = new TextEncoder();
const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(text)));
}

async function hmacSha256(key: string, msg: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg)));
}

export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const normalizeSecret = (s: string) => normalizeCode(s).replace(/(.{4})(?=.)/g, "$1-");

export async function hashPin(pin: string, salt: string): Promise<string> {
  return sha256(`${salt}:${pin}`);
}

export function randomSalt(): string {
  const b = new Uint8Array(12);
  crypto.getRandomValues(b);
  return hex(b.buffer);
}

/** Toegangscode i (1..N) afgeleid van de beheersleutel; enkel de beheerder kan dit. */
export async function inviteCode(secret: string, i: number): Promise<string> {
  const mac = await hmacSha256(secret, `invite-${i}`);
  let s = "";
  for (let j = 0; j < 6; j++) s += INVITE_ALPHABET[mac[j] % 32];
  return s;
}

export async function allInviteCodes(secret: string): Promise<string[]> {
  return Promise.all(Array.from({ length: INVITE_COUNT }, (_, i) => inviteCode(secret, i + 1)));
}

export type CodeCheck = { ok: false } | { ok: true; admin: true; secret: string } | { ok: true; admin: false; hash: string };

/** Controleert een ingegeven code: beheersleutel of een van de toegangscodes (enkel hashes in de app). */
export async function checkAccessCode(input: string, used: string[]): Promise<CodeCheck> {
  const compact = normalizeCode(input);
  if (!compact) return { ok: false };
  const secret = normalizeSecret(compact);
  if ((await sha256(secret)) === ADMIN_HASH) return { ok: true, admin: true, secret };
  const h = await sha256(compact);
  if (INVITE_HASHES.includes(h) && !used.includes(h)) return { ok: true, admin: false, hash: h };
  return { ok: false };
}

export function lockDelayMs(failed: number): number {
  if (failed < 5) return 0;
  return Math.min(10 * 60_000, 30_000 * 2 ** (failed - 5));
}

export async function createAccount(r: Registry, name: string, pin: string, check: Extract<CodeCheck, { ok: true }>): Promise<{ registry: Registry; account: Account }> {
  const salt = randomSalt();
  const account: Account = {
    id: uid(),
    name: name.trim() || "Atleet",
    pinHash: await hashPin(pin, salt),
    salt,
    createdAt: new Date().toISOString(),
    isAdmin: check.admin,
    color: ACCOUNT_COLORS[r.accounts.length % ACCOUNT_COLORS.length],
  };
  const registry: Registry = {
    ...r,
    accounts: [...r.accounts, account],
    activeId: account.id,
    adminSecret: check.admin ? check.secret : r.adminSecret,
    usedInvites: check.admin ? r.usedInvites : [...r.usedInvites, check.hash],
    failedPin: 0,
    lockedUntil: 0,
  };
  // Gegevens van vóór de accounts (één gebruiker) gaan mee naar het eerste account.
  if (r.accounts.length === 0) {
    const legacy = await appStorage.getItem(LEGACY_DATA_KEY);
    if (legacy) {
      await appStorage.setItem(`${LEGACY_DATA_KEY}:${account.id}`, legacy);
      await appStorage.removeItem(LEGACY_DATA_KEY);
    }
  }
  await saveRegistry(registry);
  setActiveAccountId(account.id);
  return { registry, account };
}

export async function verifyPin(account: Account, pin: string): Promise<boolean> {
  return (await hashPin(pin, account.salt)) === account.pinHash;
}

export async function changePin(r: Registry, accountId: string, pin: string): Promise<Registry> {
  const salt = randomSalt();
  const pinHash = await hashPin(pin, salt);
  const registry = { ...r, accounts: r.accounts.map((a) => (a.id === accountId ? { ...a, pinHash, salt } : a)) };
  await saveRegistry(registry);
  return registry;
}

export async function setActive(r: Registry, id: string | null): Promise<Registry> {
  const registry = { ...r, activeId: id, failedPin: 0, lockedUntil: 0 };
  await saveRegistry(registry);
  setActiveAccountId(id);
  return registry;
}
