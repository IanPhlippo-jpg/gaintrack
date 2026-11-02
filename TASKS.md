# Taken - GainTrack

## iOS fitness-app: voeding, training, gewicht, statistieken, dagelijkse doelen (2026-11-02)
- [x] 21st-tools laden en componenten zoeken (tracker card, bottom nav, progress ring, heatmap, weekpicker, count-up, confetti, badge, workout card, drawer, charts)
- [x] Project opzetten: Vite + React + TypeScript + Tailwind v4 + Capacitor iOS + PWA
- [x] Datamodel en opslag (zustand + persist): voeding, training, gewicht, doelen, XP/streaks
- [x] Scherm Vandaag: dagdoelen, ringen, streak, XP
- [x] Scherm Voeding: maaltijden loggen, macro's, eigen voedingsmiddelen
- [x] Scherm Training: schema's, oefeningen, sets/herhalingen/gewicht, rusttimer, PR's
- [x] Scherm Gewicht: dagelijks ingeven, grafiek, trend
- [x] Scherm Statistieken: progressie per oefening, kcal per week, heatmap, badges
- [x] Gamification: streaks, XP, levels, dagelijkse uitdagingen, confetti bij doel gehaald
- [x] Foto bij elke oefening (start/eindpositie, free-exercise-db) in standaardontwerp ExerciseMedia
- [x] Barcodes scannen (camera, BarcodeDetector/ZXing) + Open Food Facts opzoeking
- [x] Water in liter; getallen op 1 decimaal in nl-BE-notatie; eenheden niet over cijfers
- [x] Onboarding als quiz (1 vraag per scherm) → dagdoelen via Mifflin-St Jeor + programma op maat
- [x] Trainingsprogramma's voor vrouwen, mannen en iedereen (13 programma's) + wisselen in Training
- [x] Navigatiebalk met schuivende actieve pil
- [x] Rusttimer en trillen instelbaar onder profiel-icoon (aan/uit, standaardrust, overal dezelfde rust)
- [x] Testen in browser op iPhone-formaat + screenshots (docs/screenshots)
- [x] iOS-project gegenereerd (ios/, camera-rechten in Info.plist) + uitleg in README; echte build vereist Mac of cloudbuild

## iOS-app bouwen zonder Mac (2026-11-02)
- [x] iOS-iconen en splash genereren uit een 1024px-logo (@capacitor/assets)
- [x] GitHub Actions-workflow: macOS-runner bouwt web + Capacitor en levert een unsigned .ipa als artifact (+ TestFlight-workflow)
- [x] Repo aanmaken (github.com/IanPhlippo-jpg/gaintrack, publiek) en pushen; eerste cloudbuild geslaagd in 3m43s
- [x] README: .ipa installeren vanaf Windows (Sideloadly, gratis Apple ID) en de TestFlight-route met Apple Developer-account
- [x] Buildresultaat gecontroleerd; .ipa in release/GainTrack-unsigned.ipa en als artifact bij run 41424458377

## Web-app online zetten als snelkoppeling op de gsm, zonder 7-dagenlimiet (2026-11-02)
- [x] Basispad instelbaar maken (VITE_BASE) zodat dezelfde build op GitHub Pages, Vercel en in Capacitor werkt
- [x] PWA-manifest en apple-touch-icon relatief maken, start_url/scope op het basispad
- [x] GitHub Actions-workflow die de web-app bouwt en naar GitHub Pages publiceert
- [x] GitHub Pages activeren voor de repo en pushen
- [x] Online versie testen op iPhone-formaat (onboarding, installatie-metadata, manifest, service worker)
- [x] README: link, "Zet op beginscherm"-stappen, Vercel-import als alternatief

## Paars kleurenpalet + accounts per persoon met pincode en toegangscodes (2026-11-02)
- [x] Palet #0E0B1D/#2A1E4D/#5A3B8C/#8B7CC7/#C9C2E3/#3A3A52 in de tokens (index.css), rusttimer, confetti, fotofallback, theme-color
- [x] Iconen, favicon, splash en iOS-assets opnieuw gegenereerd in paars (sharp + @capacitor/assets)
- [x] Beheersleutel + 40 toegangscodes gegenereerd; enkel hashes in de app (invite-secrets.ts), codelijst privé buiten de repo
- [x] Accountregister (accounts.ts) en opslag per account (accountStorage, skipHydration + rehydrate na aanmelden)
- [x] Vergrendelscherm: account kiezen, pincode (keypad, lockout), nieuw account met naam → toegangscode → pincode
- [x] Profiel: account, pincode wijzigen, uitloggen; beheerder: codelijst met volgende vrije code, kopiëren, afvinken
- [x] Getest in browser: foute/juiste code, beheersleutel, pincode fout/juist, herladen blijft aangemeld, tweede account gescheiden
- [~] Pushen naar GitHub Pages en online controleren
