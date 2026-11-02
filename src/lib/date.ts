import { format, parseISO, differenceInCalendarDays, subDays, addDays, startOfWeek } from "date-fns";
import { nl } from "date-fns/locale";

/** YYYY-MM-DD in lokale tijd */
export const dayKey = (d: Date = new Date()) => format(d, "yyyy-MM-dd");
export const fromKey = (k: string) => parseISO(k);
export const todayKey = () => dayKey(new Date());
export const shiftKey = (k: string, days: number) => dayKey(addDays(fromKey(k), days));
export const daysBetween = (a: string, b: string) => differenceInCalendarDays(fromKey(b), fromKey(a));
export const lastNDays = (n: number, end: Date = new Date()) =>
  Array.from({ length: n }, (_, i) => dayKey(subDays(end, n - 1 - i)));
export const fmtDay = (k: string, pattern = "EEEE d MMMM") => format(fromKey(k), pattern, { locale: nl });
export const fmtShort = (k: string) => format(fromKey(k), "d MMM", { locale: nl });
export const weekStartKey = (k: string) => dayKey(startOfWeek(fromKey(k), { weekStartsOn: 1 }));
export const weekdayOf = (k: string) => fromKey(k).getDay(); // 0 = zondag
export const WEEKDAYS_NL = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
export { nl };
