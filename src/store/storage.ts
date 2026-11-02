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
