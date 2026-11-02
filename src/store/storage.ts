import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";
import type { StateStorage } from "zustand/middleware";

/** Op iOS (Capacitor) bewaren we in Preferences, in de browser in localStorage. */
export const appStorage: StateStorage = Capacitor.isNativePlatform()
  ? {
      getItem: async (name) => (await Preferences.get({ key: name })).value,
      setItem: async (name, value) => {
        await Preferences.set({ key: name, value });
      },
      removeItem: async (name) => {
        await Preferences.remove({ key: name });
      },
    }
  : {
      getItem: (name) => localStorage.getItem(name),
      setItem: (name, value) => localStorage.setItem(name, value),
      removeItem: (name) => localStorage.removeItem(name),
    };

/** Account dat op dit toestel is aangemeld; de store bewaart alles onder <naam>:<accountId>. */
let activeAccountId: string | null = null;
export const setActiveAccountId = (id: string | null) => {
  activeAccountId = id;
};
export const getActiveAccountId = () => activeAccountId;

const scoped = (name: string) => (activeAccountId ? `${name}:${activeAccountId}` : `${name}:__none__`);

/** Opslag voor de zustand-store: dezelfde sleutel, maar per aangemeld account. */
export const accountStorage: StateStorage = {
  getItem: (name) => appStorage.getItem(scoped(name)),
  setItem: (name, value) => {
    if (!activeAccountId) return; // niets wegschrijven zonder aangemeld account
    return appStorage.setItem(scoped(name), value);
  },
  removeItem: (name) => appStorage.removeItem(scoped(name)),
};
