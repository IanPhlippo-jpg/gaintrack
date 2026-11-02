import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "be.eventus.gaintrack",
  appName: "GainTrack",
  webDir: "dist",
  ios: { contentInset: "automatic", backgroundColor: "#11151c" },
  plugins: { StatusBar: { style: "DARK" } },
};

export default config;
