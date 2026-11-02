import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export const round = (n: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const fmtKg = (n: number) => `${round(n, 1).toLocaleString("nl-BE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
export const fmtInt = (n: number) => Math.round(n).toLocaleString("nl-BE");
