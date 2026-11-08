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
- [x] Pushen naar GitHub Pages en online controleren (run 41439496330)

## Bugfix: getal typen in NumberStepper sprong naar 300 kg (2026-11-02)
- [x] Typbuffer in NumberStepper: pas afronden/begrenzen bij verlaten van het veld of Enter; selectie bij focus ook op iOS
- [x] Testen in browser (gewicht in quiz, profiel) en pushen naar GitHub Pages

## Eigen schema's beter maken + splits per aantal dagen met glute-focus voor vrouwen (2026-11-02)
- [x] Schema-editor herbouwen: emoji-keuze, dagen, inklapbare oefeningrijen met grote steppers, meerdere oefeningen tegelijk toevoegen; bug gefixt dat oefeningen niet aan te tikken waren (foto ving de tik op)
- [x] Programma's uitbreiden naar 20: vrouwen 2-6 dagen met glute-focus (hip thrust, RDL, abductie, kickbacks), mannen 2-6 dagen, iedereen 2-4 dagen
- [x] Programmakiezer met filter op dagen per week en aanbeveling uit de quiz
- [x] Alle oefening-id's in de programma's gecontroleerd tegen de oefeningenlijst (390 verwijzingen, 0 ontbrekend)
- [x] Getest in browser (nieuw schema met 3 oefeningen, programma-filter 5 dagen vrouwen, klassement, roerei-zoeken); screenshots 16-18; online zoeken enkel beperkt testbaar door OFF-rate-limit
- [x] Profielfoto per account (upload, verkleind naar 256 px) in profiel, kop, vergrendelscherm en klassement
- [x] Weekklassement op Vandaag (top 3 + paneel per week); synchronisatie via Supabase voorbereid (src/lib/sync.ts, supabase/schema.sql, variabelen in pages.yml)
- [x] Voedingsbibliotheek uitgebreid van 78 naar 334 producten (roerei, omelet, Belgische klassiekers, dranken, snacks, maaltijden) + online zoeken op naam via Open Food Facts

## Updates zichtbaar maken op de snelkoppeling (2026-11-02)
- [x] Versienummer (datum · git-hash) en knop "Zoek update" onder het profiel
- [x] Service worker handmatig geregistreerd met updatecheck bij elke keer openen en elke 30 min; nieuwe versie herlaadt vanzelf
- [x] Gepusht en live gecontroleerd

## Voedingslijst echt uitgebreid + synoniemen (2026-11-02)
- [x] Food krijgt `aliases` (zoeksynoniemen zoals kippenwit, hesp, tuc); zoeken matcht op naam + synoniemen
- [x] Automatisch online zoeken (Open Food Facts) zodra de bibliotheek niets vindt, met cooldown
- [x] foods-extra.ts: 395 extra producten (totaal 729) (charcuterie, crackers en koeken, kazen, vis, maaltijden, fastfood, snoep, dranken, supplementen)
- [x] Dubbele id's gecontroleerd (0), build, pushen, live controleren
- [x] Gerechten: eigen recept uit ingrediënten (grammen per ingrediënt, aantal porties), totalen en per-100 g berekend, bewaard als eigen voedingsmiddel met ingrediëntenlijst
- [x] Barcodescanner robuuster op iPhone-PWA: camera start pas na tik (gebruikersgebaar), duidelijke foutmelding, fallback via foto nemen (ZXing op afbeelding), handmatig typen blijft

## 2000+ producten en tragere levels (2026-11-02)
- [x] NEVO (RIVM) bekeken: enkel via aanvraagformulier en onveranderd te gebruiken, dus niet gebruikt
- [x] 1700 populairste producten BE/NL uit Open Food Facts v2 gehaald (24 pagina's, 6,5 s pauze, 503-retries)
- [x] Omgezet en gefilterd: 1391 bruikbare merkproducten (foods-off.json, 231 KB) → totaal 2120 in de app
- [x] Levelcurve: 600 × (level−1)^1,8 XP (level 10 bij 31.320 XP, level 20 bij 120.200 XP)
- [x] Supabase: via toegangstoken van Ian; bestaand project zdiycofagksxoetewpjb (eu-west-1) gebruikt, schema.sql uitgevoerd, REST getest, VITE_SUPABASE_URL/ANON_KEY als Actions-variabelen, Pages herbouwd
- [x] Live gezet (04f2242 + herbouw met Supabase-variabelen)

## Weekbalkjes en klassement verversen (2026-11-02)
- [x] "Deze week" toont maandag t.e.m. zondag; dag zonder registratie = 0 % (rustdag telt niet vanzelf); toekomstige dagen gedimd
- [x] Klassement ververst bij openen van de app en elke minuut (scores van andere gsm's)
- [x] Live gezet

## Beloningen ontgrendelen per level (2026-11-02)
- [x] unlocks.ts: beloningen per level (avatar-ringen, accentkleuren, titels, confetti-stijl, voordelen: streak-schild, dubbele XP in het weekend, weekbonus)
- [x] Store: gekozen ring/kleur/titel bewaren; voordelen toepassen in awardXp en currentStreak
- [x] Beloningenscherm (leveltrack) vanuit de levelkaart op Vandaag; "volgende beloning" op de kaart
- [x] Ring en titel zichtbaar in kop, vergrendelscherm en klassement; meegestuurd naar Supabase (kolommen frame, title)
- [x] Viering (confetti + toast) bij nieuw level met de ontgrendelde beloning
- [x] Getest in browser (level-up-viering, ring actief, gouden accent, dubbele weekend-XP), gepusht en live

## Landschapsmodus nakijken (2026-11-02)
- [x] Alle schermen bekeken op 812×375: smalle kolom met lege zijkanten, nav-balk nam hoogte in, pincodescherm paste niet, panelen te breed
- [x] Liggend (short-variant): zijbalk-navigatie links, twee kolommen op Vandaag/Voeding/Gewicht/Stats, panelen gecentreerd (max 760 px), pincode naast het toetsenbord, safe-areas links/rechts
- [x] Gecontroleerd liggend en staand; levels trager (800×(L−1)^2,1), water-XP enkel tot dagdoel, max 6 maaltijd-XP per dag, kcal binnen 7 %; live gezet

## Meldingen tijdens je training: tik en vul reps en gewicht in (2026-11-08)
- [x] Training-flow bekijken (sets loggen, rusttimer, service worker)
- [x] Supabase: tabel push_jobs + edge function rest-push (web push met VAPID, plannen en annuleren)
- [x] Service worker: push tonen, tik opent de app op de juiste set
- [x] Profiel: "Meldingen tijdens training" aanzetten (toestemming + inschrijving)
- [x] Rusttimer: melding plannen als de app op de achtergrond gaat, annuleren bij terugkomen
- [x] Snel-invulscherm: reps en gewicht voor de volgende set, vooraf ingevuld, opslaan start de volgende rust
- [x] Testen in de browser (gsm-formaat): link opent invulscherm, opslaan start de rust, plannen en annuleren
- [ ] Server klaarzetten (push.sql, functie rest-push, VAPID-secrets) en daarna live zetten op GitHub Pages

## Coins, winkel en een eigen diertje (2026-11-08)
- [x] Coins: bij elk nieuw level een pot coins (50 × level), plus 1 coin per 10 XP zodat je ook tussen levels iets verdient
- [x] Diertje: naam kiezen, groeit van baby tot volwassen door eten en verzorging; honger, verzorging en humeur zakken met de tijd
- [x] Winkel: eten, verzorging, accessoires (pet, zonnebril, halter, kroon ...), kleuren en achtergronden voor het diertje
- [x] Winkel profiel: extra avatar-ringen, accentkleuren, titels en confetti om te kopen
- [x] Kaart op Vandaag, coins in het level-kader en in de levelviering
- [x] Testen op gsm-formaat, commit

## Voedingsdatabank naar 5.000 tot 10.000 producten (2026-11-08)
- [x] Huidige bron en script bekijken (Open Food Facts BE/NL)
- [x] Meer supermarktproducten ophalen, dubbels en onvolledige producten eruit
- [x] Zoeken snel houden met de grotere lijst (laden, bundelgrootte)
- [x] Testen en commit
