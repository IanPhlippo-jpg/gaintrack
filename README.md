# GainTrack

iOS-app (Capacitor + React) om voeding, training en gewicht bij te houden, met dagelijkse doelen, streaks, XP en badges.

## Ontwikkelen

```bash
npm install
npm run dev        # http://127.0.0.1:5180
npm run typecheck
npm run build
```

## Op je iPhone zetten

### Snelste weg (zonder Mac): als web-app
1. `npm run build` en zet de map `dist/` online (Netlify, Vercel, eigen server) of serveer ze lokaal met `npm run preview`.
2. Open de link in Safari op je iPhone → Deel → **Zet op beginscherm**. De app draait dan schermvullend als PWA en bewaart je gegevens op het toestel.

### Echte iOS-app zonder Mac: cloudbuild + Sideloadly
De workflow `.github/workflows/ios-build.yml` bouwt bij elke push op een macOS-runner van GitHub een **unsigned .ipa** en zet die als artifact bij de run (Actions → iOS build → Artifacts → `GainTrack-unsigned-ipa`).

Zo zet je die op je iPhone vanaf Windows (gratis Apple ID volstaat):
1. Installeer [Sideloadly](https://sideloadly.io) op je pc en iTunes (Microsoft Store-versie werkt niet; neem de versie van apple.com) voor de USB-driver.
2. Sluit je iPhone aan met een kabel en tik op *Vertrouw deze computer*.
3. Download de .ipa uit het artifact (zip uitpakken → `GainTrack-unsigned.ipa`) en sleep hem in Sideloadly.
4. Vul je Apple ID in en klik *Start*. Sideloadly signeert de app met jouw account en installeert ze.
5. Op de iPhone: Instellingen → Algemeen → VPN en apparaatbeheer → vertrouw je Apple ID. Daarna start GainTrack gewoon vanaf het beginscherm.

Met een gratis Apple ID blijft de app 7 dagen geldig; daarna sleep je dezelfde .ipa opnieuw in Sideloadly (je gegevens blijven bewaard). Met een betaald Apple Developer-account is dat 1 jaar.

### TestFlight / App Store (Apple Developer-account, 99 EUR per jaar)
`.github/workflows/ios-testflight.yml` archiveert, signeert en uploadt naar TestFlight. Zet de secrets uit het commentaar bovenaan dat bestand in de repository (Settings → Secrets → Actions) en start de workflow handmatig via *Run workflow*.

### Met een Mac
```bash
npm run ios:sync   # bouwt de web-app en synct het ios/-project
npm run ios:open   # opent ios/App in Xcode
```
In Xcode: kies je team onder *Signing & Capabilities*, sluit je iPhone aan en druk op Run.

### Iconen en splash
`assets/logo.png`, `assets/logo-dark.png` en `assets/splash*.png` zijn de bronbestanden; `npx @capacitor/assets generate --ios` maakt daaruit alle iOS-formaten in `ios/App/App/Assets.xcassets`.

## Structuur
- `src/screens/` – Vandaag, Voeding, Training (+ actieve training, oefeningen, historiek), Gewicht, Statistieken, onboarding, profiel
- `src/components/ui/` – UI-componenten, grotendeels afkomstig van 21st.dev en aangepast (bottom nav, progress ring, count-up, weekpicker, heatmap, confetti, badges, tracker card, stat cards, drawer, tabs)
- `src/components/ui/exercise-media.tsx` – het standaardontwerp voor oefeningsfoto's (start/eindpositie, spiergroep, materiaal)
- `src/store/` – zustand-store met persist (localStorage in de browser, Capacitor Preferences op iOS)
- `src/lib/` – berekeningen (e1RM, volume, trends), gamification (XP, levels, badges, uitdagingen), statistieken
- `src/data/` – basisvoeding (NL), basisoefeningen (NL) en de fotodatabase (876 oefeningen, free-exercise-db)

## Onboarding als quiz
Eén vraag per scherm (naam, geslacht, leeftijd, lengte, gewicht, doel, activiteit, trainingsdagen, ervaring). Daaruit worden de dagdoelen berekend (Mifflin-St Jeor × activiteitsfactor, eiwit 2 g/kg, vet 27 %, water 35 ml/kg) en wordt een trainingsprogramma op maat voorgesteld. Het startgewicht wordt niet automatisch als meting geteld: de eerste weging bevestig je zelf op het gewichtsscherm.

## Trainingsprogramma's
13 programma's in `src/data/programs.ts`, opgesplitst in **vrouwen** (starter, full body, glutes & legs, upper/lower, shape & strength), **mannen** (starter, full body, 5×5, upper/lower, bodybuilding split, push/pull/legs) en **iedereen** (thuis zonder toestellen, full body basis). Wisselen via Training → Programma's; elk schema blijft daarna aanpasbaar.

## Barcodes scannen
In de voedingskiezer: tik op het barcode-icoon, richt de camera op de streepjescode. De app gebruikt de ingebouwde BarcodeDetector of ZXing en zoekt het product op bij Open Food Facts (waarden per 100 g). Gevonden producten worden bewaard als eigen voedingsmiddel, dus de volgende scan werkt ook offline. Niet gevonden? Dan vul je het zelf in, gekoppeld aan de barcode.

## Instellingen (profiel-icoon)
Profiel en doelen, herberekenen van macro's, rusttimer (aan/uit, standaardrust, overal dezelfde rust), trillen, alles wissen.

## Gamification
- **Dagdoelen**: calorieën binnen 10 %, eiwit, water, gewogen, training (of rustdag). Alles gehaald = perfecte dag (+100 XP + streakbonus).
- **Streak**: aantal perfecte dagen op rij.
- **Uitdaging van de dag**: wisselt per dag (eiwitboost, volume, sets, vroege weging, …), +30 tot +70 XP.
- **XP**: maaltijd 10, water 5, weging 25, training 60 + 2 per set, PR 40.
- **Badges**: 18 stuks, met voortgangsring voor wat nog te halen is.

## Foto's bij oefeningen
Elke oefening toont een foto van iemand die de oefening uitvoert, uit de open [free-exercise-db](https://github.com/yuhonas/free-exercise-db). Start- en eindpositie wisselen af; tikken wisselt handmatig. Eigen oefeningen krijgen een eigen foto (camera) of een foto uit de database.
