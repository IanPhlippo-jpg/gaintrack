# GainTrack

Persoonlijke fitness-app (web-app/PWA + Capacitor iOS) om voeding, training en gewicht bij te houden, met dagelijkse doelen, streaks, XP en badges. Paars kleurenpalet: #0E0B1D, #2A1E4D, #5A3B8C, #8B7CC7, #C9C2E3, #3A3A52.

**Online:** https://ianphlippo-jpg.github.io/gaintrack/ (wordt bij elke push op `master` opnieuw gepubliceerd via `.github/workflows/pages.yml`).

## Ontwikkelen

```bash
npm install
npm run dev        # http://127.0.0.1:5180
npm run typecheck
npm run build
```

## Op je iPhone zetten

### Snelste weg (zonder Mac, geen 7-dagenlimiet): als web-app op het beginscherm
1. Open https://ianphlippo-jpg.github.io/gaintrack/ in **Safari** op je iPhone.
2. Tik op Deel → **Zet op beginscherm**. De app start dan schermvullend met eigen icoon, werkt offline (service worker) en bewaart alles op het toestel. Geen hersigneren, geen kabel.
3. Updates komen vanzelf binnen: de app controleert bij elke keer openen (en elke 30 min) op een nieuwe versie en herlaadt dan. Onder het profiel-icoon zie je de versie (datum · git-hash) en staat een knop "Zoek update". Ziet je snelkoppeling de update niet, sluit de app dan volledig (app-kiezer, omhoog vegen) en open ze opnieuw.

Liever op Vercel? Importeer de GitHub-repo op vercel.com (framework Vite wordt herkend, geen instellingen nodig). Laat `VITE_BASE` leeg: op Vercel staat de app op `/`. Alleen GitHub Pages heeft het basispad `/gaintrack/` nodig, dat zet de workflow zelf.

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

## Accounts, pincode en toegangscodes
- **Per persoon een account**: naam + pincode van 4 cijfers. De gegevens van elk account staan apart op het toestel (`gaintrack-v1:<accountId>`); het accountregister staat in `gaintrack-accounts`.
- **Toestel onthoudt wie is aangemeld**: de pincode geef je één keer per toestel in. Uitloggen kan onder het profiel-icoon (gegevens blijven op het toestel staan). Na 5 foute pincodes volgt een oplopende wachttijd.
- **Nieuw account enkel met een toegangscode**: wie een account wil, vraagt een code aan de beheerder (Ian). In de app staan alleen SHA-256-hashes van de 40 codes (`src/lib/invite-secrets.ts`); de codes zelf worden afgeleid van de beheersleutel en zijn enkel zichtbaar voor de beheerder onder Profiel → Beheer (met "volgende vrije code", kopiëren en afvinken). Elke code werkt één keer per toestel.
- **Beheerder**: wie bij het aanmaken van een account de beheersleutel (XXXX-XXXX-XXXX-XXXX) als toegangscode ingeeft, wordt beheerder. De sleutel en de codelijst staan NIET in de repo (privébestand bij Ian). Nieuwe set nodig? Genereer opnieuw met het node-script uit de sessie en vervang `invite-secrets.ts`.
- Er is geen server: accounts en gegevens staan per toestel. Synchroniseren tussen toestellen vraagt later een backend (bv. Supabase).

## Onboarding als quiz
Eén vraag per scherm (naam, geslacht, leeftijd, lengte, gewicht, doel, activiteit, trainingsdagen, ervaring). Daaruit worden de dagdoelen berekend (Mifflin-St Jeor × activiteitsfactor, eiwit 2 g/kg, vet 27 %, water 35 ml/kg) en wordt een trainingsprogramma op maat voorgesteld. Het startgewicht wordt niet automatisch als meting geteld: de eerste weging bevestig je zelf op het gewichtsscherm.

## Trainingsprogramma's
20 programma's in `src/data/programs.ts`, voor 2 tot 6 trainingsdagen per week, opgesplitst in **vrouwen** met nadruk op billen (glute starter 2d, full body 3d, glutes focus 3d, glutes & legs 4d, upper/lower 4d, booty builder 5d, shape & strength 5d, glute PPL 6d), **mannen** (starter 2d, full body 3d, 5×5, PPL 3d, upper/lower 4d, bodybuilding split 5d, upper/lower + PPL 5d, PPL 6d) en **iedereen** (thuis 2d en 3d, full body basis 3d, upper/lower 4d). In Training → Programma's filter je op aantal dagen; het programma dat bij je quiz past krijgt "Aanbevolen". Elk schema blijft daarna aanpasbaar.

## Eigen schema's
Training → **Nieuw schema**: naam en emoji, trainingsdagen, en oefeningen die je met meerdere tegelijk toevoegt (kiezer blijft open, afgevinkt wat al in het schema zit). Per oefening klap je sets, herhalingen en rust open; volgorde wisselen en verwijderen kan daar ook. Bestaande schema's bewerk je via het potlood.

## Weekklassement en profielfoto
Op Vandaag staat het **weekklassement** (XP van maandag tot zondag, met trainingen, sets en perfecte dagen als tiebreak), met een paneel per week. Het klassement is gedeeld via Supabase (project `zdiycofagksxoetewpjb`, regio eu-west-1): elke speler stuurt naam, foto en weekscore door en ziet de anderen, ook op andere gsm's. Opzet voor een nieuw project: voer `supabase/schema.sql` uit in het Supabase-project en zet `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` als Actions-variabelen in de repo (Settings → Secrets and variables → Actions → Variables); de workflow bouwt ze mee. Elke speler stuurt dan zijn naam, foto en weekscore naar de tabellen `players` en `scores`.
Een **profielfoto** kies je onder het profiel-icoon (verkleind tot 256 px, lokaal bewaard, meegestuurd naar het klassement).

## Melding na je rusttijd (reps en gewicht invullen)
Vink je een set af en vergrendel je je gsm (of ga je naar een andere app) terwijl de rust loopt, dan krijg je na de rusttijd een melding, bv. "Rust voorbij · Bankdrukken (barbell), set 3: 60 kg × 8. Tik om in te vullen." Tik je erop, dan opent de training met een klein invulscherm voor die set: gewicht en herhalingen staan al ingevuld (wat je invulde, anders de vorige set, anders vorige keer). **Set opslaan** vinkt de set af en start meteen de volgende rust. Ben je terug in de app voor de rust voorbij is, dan wordt de melding geschrapt.

- Aanzetten: profiel-icoon → Rusttimer → **Melding na je rusttijd**. Op de iPhone werkt dit alleen in de web-app op het beginscherm (iOS 16.4 of nieuwer); iOS laat geen invulvelden in de melding zelf toe, daarom opent een tik het invulscherm.
- Een web-app op de achtergrond kan geen timer laten lopen. Daarom plant de Supabase edge function `rest-push` de melding en stuurt ze via web push (VAPID). Code: `src/lib/push.ts` (app), `public/push-sw.js` (service worker), `supabase/functions/rest-push` (server), `supabase/push.sql` (tabel `push_jobs`, enkel leesbaar voor de functie).
- Opzet (eenmalig): voer `supabase/push.sql` uit, zet de secrets `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` en `VAPID_SUBJECT` en deploy de functie met `npx supabase functions deploy rest-push --project-ref zdiycofagksxoetewpjb --no-verify-jwt`. De geheime VAPID-sleutel staat buiten de repo; de publieke staat in `src/lib/push.ts`.

## Coins, winkel en je diertje
Je verdient **coins** met XP: 1 coin per 10 XP, en bij elk nieuw level een pot van 50 × dat level (level 3 = 150 coins). Coins worden afgeleid uit je XP, net zoals je level, dus bestaande spelers krijgen meteen coins voor wat ze al haalden. Uitgegeven coins staan in de store (`coinsSpent`).

Op Vandaag staat **Je diertje**. Je adopteert het, geeft het een naam en het groeit van baby via kind en tiener tot volwassen (met spierballetjes). Eten, verzorging en plezier zakken met de tijd (na een dag zonder eten heeft het honger); 's nachts slaapt het. Een verwaarloosd diertje groeit maar half zo snel en elke afgewerkte training maakt het blij.

De winkel heeft vijf tabbladen:
- **Eten** en **Verzorging**: geef je meteen (appel, eiwitshake, kip met rijst, bubbelbad, balletje ...). Ze vullen de balkjes en geven groeipunten.
- **Accessoires**: petje, zweetband, koptelefoon, kroon, zonnebril, sjaal, gouden ketting, strikje, mini-halter, shakebeker. Je koopt ze één keer en doet ze aan of uit (één per plek: hoofd, ogen, nek, hand).
- **Stijl**: andere kleuren en achtergronden (gym, strand, bos, ruimte) voor je diertje.
- **Profiel**: extra avatar-ringen, accentkleuren, titels en confetti, bovenop wat je met levels ontgrendelt. Ringen en titels zien de anderen in het klassement.

Permanente items vragen een tweede tik ter bevestiging. Code: `src/lib/shop.ts` (coins, catalogus, regels), `src/components/pet/PetAvatar.tsx` (tekening), `src/screens/PetDrawer.tsx` (scherm en winkel).

## Gerechten samenstellen
In de voedingskiezer: koksmuts-icoon → **Nieuw gerecht**. Geef een naam, zoek ingrediënten uit de bibliotheek en zet per ingrediënt de hoeveelheid in gram; kies het aantal porties. De app telt kcal, eiwit, koolhydraten en vet op (totaal en per portie) en bewaart het gerecht als eigen voedingsmiddel met waarden per 100 g en "1 portie" als standaardhoeveelheid. Gerechten staan onder Eigen met een koksmuts en zijn via het potlood aan te passen.

## Voeding zoeken
8729 producten: 729 basisproducten (België/Nederland: eieren en roerei, vlees, vis, zuivel, brood en beleg, maaltijden, snacks, dranken, supplementen) met gangbare porties, plus 8000 populaire supermarktproducten uit België en Nederland (merkproducten met barcode, uit [Open Food Facts](https://world.openfoodfacts.org), open data onder ODbL, laatst geïmporteerd op 8 november 2026; bestand `src/data/foods-off.json`). Opnieuw of groter importeren: `python scripts/import-off.py 10000` (houdt bestaande producten, neemt enkel producten met volledige en kloppende voedingswaarden). De supermarktlijst zit in een apart bestand dat geladen wordt zodra de app rustig is, dus het opstarten blijft even snel; offline werkt ze ook. Zoeken negeert accenten, matcht alle woorden en kent synoniemen (kippenwit, hesp, tuc, nutella, friet, …). Vindt de bibliotheek niets, dan zoekt de app na een seconde automatisch **online** (Open Food Facts v2, op merk en categorie) of scan je de barcode; gevonden producten komen onder Eigen en werken daarna offline.

## Barcodes scannen
In de voedingskiezer: tik op het barcode-icoon en dan op **Camera openen** (iOS laat de camera pas toe na een tik). Richt de camera op de streepjescode. Lukt het niet, neem dan een **foto van de barcode** (wordt uitgelezen) of typ de code. De app gebruikt de ingebouwde BarcodeDetector of ZXing en zoekt het product op bij Open Food Facts (waarden per 100 g). Gevonden producten worden bewaard als eigen voedingsmiddel, dus de volgende scan werkt ook offline. Niet gevonden? Dan vul je het zelf in, gekoppeld aan de barcode.

## Instellingen (profiel-icoon)
Profiel en doelen, herberekenen van macro's, rusttimer (aan/uit, standaardrust, overal dezelfde rust), trillen, alles wissen.

## Liggende stand
Op een liggende gsm (`short`-variant in `src/index.css`: landscape en hoogte ≤ 520 px) staat de navigatie als zijbalk links, krijgen Vandaag, Voeding, Gewicht en Statistieken twee kolommen, blijven panelen gecentreerd op maximaal 760 px en staat het pincodetoetsenbord naast de tekst.

## Beloningen per level
Onder de levelkaart op Vandaag staat **Beloningen**: elk level ontgrendelt iets (`src/lib/unlocks.ts`). Cosmetisch en zichtbaar voor anderen in het klassement: avatar-ringen (brons 2, zilver 6, goud 10, diamant 15, legende 20), accentkleuren (goud 3, roze 7, groen 11, vuur 17), titels (4, 9, 14, 20, 30) en confetti (13, 25). Voordelen: streak-schild op level 5 (een gemiste dag per week breekt de streak niet), dubbele XP in het weekend op level 8, weekbonus van 250 XP bij 5 perfecte dagen op level 12. Bij een nieuw level verschijnt een viering met wat je ontgrendeld hebt; op de levelkaart staat altijd de volgende beloning.

## Gamification
- **Dagdoelen**: calorieën binnen 7 %, eiwit, water, gewogen, training (of rustdag). Alles gehaald = perfecte dag (+100 XP + streakbonus).
- **Streak**: aantal perfecte dagen op rij.
- **Uitdaging van de dag**: wisselt per dag (eiwitboost, volume, sets, vroege weging, …), +30 tot +70 XP.
- **XP**: maaltijd 10 (max. 6 per dag), water 5 (enkel tot je dagdoel), weging 25, training 60 + 2 per set, PR 40. Levels: 800 × (level − 1)^2,1 XP (level 5 bij 14.700, 10 bij 80.700, 20 bij 387.700).
- **Badges**: 18 stuks, met voortgangsring voor wat nog te halen is.

## Foto's bij oefeningen
Elke oefening toont een foto van iemand die de oefening uitvoert, uit de open [free-exercise-db](https://github.com/yuhonas/free-exercise-db). Start- en eindpositie wisselen af; tikken wisselt handmatig. Eigen oefeningen krijgen een eigen foto (camera) of een foto uit de database.
