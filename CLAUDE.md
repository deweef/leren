# Leerhoek – instructies voor Claude Code

## Wat dit is
Een oefensite voor Ben en Dana (havo/vwo), gehost via GitHub Pages op https://deweef.github.io/leren/.
Doel: leren makkelijker en leuker maken. Alles in het Nederlands, kort en vriendelijk. Marcel (de ouder)
bouwt het samen met Claude; hij wil ook zelf kunnen meeleren (scheikunde: hij begon met 0 voorkennis).

- `index.html`: wachtwoord (SHA-256 in `H`, alleen een drempel: de repo is openbaar), daarna "Wie ben jij?"
  (`leren-wie` = `ben`, `dana`, `marcel`, `anja` of `gast`) en per persoon kaarten naar de vakken. Marcel en Anja zien
  alles en zitten achter een pincode (SHA-256 in `PIN`, drempel). "Ik ben een vriend(in)" = gast: naam + klas in
  `leren-gast` ({naam, klas: 'havo4' = vakken van Ben, 'vwo3' = vakken van Dana}). Het oude `alle` (Ouder) wordt
  overal één keer `marcel`, met de opslag `@alle` → `@marcel` (`wie()` in index.html, `lerenWie()` in leerlog.js). Elke vakpagina stuurt
  zonder `leren-ok` terug naar `index.html`.
- Elk vak is één los HTML-bestand (geen build, geen CDN behalve Google Fonts), met voortgang in localStorage:
  `engels.html` (Ben, `unit3-trainer-v1`), `biologie.html` (Ben, `bio-thema1-v1`), `wiskunde.html` (Ben, H2
  statistiek, `wis-h2-v1`), `scheikunde-h1.html` (H1 chemisch rekenen, `chem-h1-v1`), `scheikunde.html` (H2
  bindingen, `chem-h2-v1`), Frans voor Dana: `frans.html`, `frans-copilot.html`, `frans-combi.html`,
  `frans-spel.html` (spelletjes), `frans-5.html` (versie 5, zie onder).
- **Voortgang per persoon**: `leerlog.js` (eerste script in de head van elke vakpagina) zet stil `@<wie>` achter elke
  localStorage-sleutel behalve `leren-*` (`chem-h1-v1@ben`, `@dana`, `@marcel`, `@anja`, `@gast-<naam>`), zodat iedereen op hetzelfde apparaat
  eigen voortgang heeft. Pagina's gebruiken gewoon hun KEY (alleen `getItem`/`setItem`/`removeItem`; ga niet zelf door
  `localStorage.key(i)` lopen). Oude sleutels zonder `@` (van vóór de splitsing) krijgen Ben, Dana en Marcel één keer als
  beginstand (Anja en gasten beginnen leeg); wissen kan per persoon via "Zo pak je het aan" → Voortgang wissen.
- **Synchroniseren tussen apparaten** (ook in `leerlog.js`; niet voor gasten, en gasten komen ook niet in het logboek): elke wijziging krijgt een tijdstempel (`leren-tijd@<wie>`,
  alleen als de waarde echt verandert) en gaat 15 s later (en bij weggaan) naar het Apps Script (`actie=bewaar`, tabblad
  'Leerhoek opslag'). Bij openen haalt de pagina `?actie=stand&naam=..` op (pagina tot max. 3 s half doorzichtig en niet
  aan te raken, `html.leren-laden`), neemt nieuwere standen over (vergelijk met de tijd van vóór het openen, `tijd0`) en
  herlaadt één keer. Oude standen zonder tijdstempel: de grootste wint. Laatste wijziging wint per pagina-sleutel.
- Het leerlogboek zet in de stand ook `afgerond: 0, 1.1, ...` (delen van `ROUTE` waarvan alle stappen met gewicht
  gehaald zijn, via `rDone`) en in "wat gedaan" `deel X afgerond ✓`.
- `sw.js`: service worker (eerst netwerk, anders bewaarde kopie). **Hoog `leerhoek-vN` op bij elke wijziging.**
- Elke pagina begint zijn `<style>` met `*{touch-action:manipulation}`: anders zoomt de iPad in bij twee keer snel
  tikken. Tekenvlakken e.d. houden hun eigen `touch-action:none` (specifieker).
- "‹ Alle vakken" staat bovenaan het hoofdmenu (`<main id="home">`) van elk vak, niet zwevend: tijdens een spel
  ga je met Stoppen/Terug linksboven eerst naar het menu.

## Opbouw van een vakpagina (scheikunde, wiskunde)
`SECS` (paragrafen), `TH` (theorie per onderwerp), `LP` (leerpad: kaartjes `[titel, html, [vraag, goed,
'fout|fout', uitleg]?]`), `MC` (meerkeuze), `GENS` (sommengeneratoren, `SECGENS` per paragraaf), spellen, en de
schermen `show('home'|'play')`, `goHome()`, `ask()`, `practice(sec)` (oefenronde), `trainer(k)` (snel oefenen),
`toets()` (proeftoets, cijfer in `S.best`).

## Vaste onderdelen (zo doen we het overal)
- **Leerroute** (`ROUTE`, kaart bovenaan in `#lpbox`, `routeScreen()`): één logische volgorde voor iemand zonder
  voorkennis. Per paragraaf: leerpad → direct het spel of snel-oefenen over precies dat stukje → oefenronde →
  het kamp van de berg als eindcheck. Stap = `[id, deel, titel, waarom nu, gewicht, type, arg, doel]`.
  **De gewichten tellen op tot precies 100** (dat is het %). Een stap telt pas als het doel gehaald is
  (bijv. oefenronde 80% in één keer goed, snel oefenen 5 op rij, proeftoets een 7). Vanuit de route gestart
  (`RT.on`) gaat `goHome()` terug naar de route, met "Gehaald: … +x%". `window.leerVoortgang` geeft het % door
  aan het leerlogboek.
- **Berg** (`klimHome`, `KCAMPS`, `KGEN`): alle vragen van het hoofdstuk, één kamp per paragraaf, 100% = alles
  één keer goed. Wiskunde: Statistiekberg, scheikunde H1: Molberg, H2: Bindingsberg, biologie: Celberg (eigen
  versie: kennisvragen en begrippen als meerkeuze, 7 kampen), Engels: Woordenberg (alle woorden, kamp per blok
  van 3 bladzijden, `S.klim.m[woord]`). Engels heeft een woordjespad (`ROUTE` per blok: inprenten, spelletje, kamp). Elk vak met een route
  eindigt met een berg (kampen in de route na de oefenronde). Klassenaam `bkamp` (niet `kc`: dat is de
  Kolommentabel in H1).
- **Nalezen** na een oefenronde: `LEES` koppelt `th`/`gen` aan leerpad-kaartjes; de knop "Nalezen" toont alleen
  die kaartjes (`leesStart`, `G.sel`), daarna "Nog een oefenronde". Nieuwe kaartjes of vragen: houd `LEES` bij.
- **Samenvatting voor de toets** (`samenvatting()`, inhoud in `SAMENV()`): leespagina zonder vragen, met inleiding
  (waar gaat het over) en per paragraaf "Hier leer je" + kernpunten. Knop `#samen` bij Toets; laatste routestap
  `samen` met gewicht 0 (telt niet mee voor het %). Biologie en Frans hebben een eigen Samenvatting
  (`sumView`), ook met een inleiding bovenaan. Leerpad-eindscherm (`lpKlaar`): "Kijk hier nog even naar" toont
  alleen dat ene kaartje (`G.sel===2`) en gaat dan terug naar het eindscherm (✓ bij nagekeken kaartjes).
- **Uitleg voor beginners**: Marcel leert scheikunde zonder voorkennis. Leerpad 0 (H1) begint daarom met "Wat is een
  atoom?" en "Atoom, molecuul en stof" (Lego: atoom = steentje, molecuul = bouwwerkje, stof = bak vol dezelfde),
  leerpad 1.1 heeft "Molecuulmassa: tel de steentjes op". Plaatjes zijn inline SVG met de helpers `zoomFig()`,
  `legoFig()`, `elementFig()`, `massaFig()`, `steen()`, `h2o()` (scheikunde-h1.html). In 1.2-1.4 hangen plaatjes
  aan bestaande kaartjes via `voegToe(sec, titel, fig)` (`figDozijn`, `figWeeg`, `figDicht`, `figTaart`, `figPpm`,
  `figMolair`, `figBehoud`, `figTosti`; klasse `.lpfig`). De mol is een **telwoord, net als een dozijn** (niet "de mol is
  een dozijn"); kaartje "De mol: een telwoord, net als een dozijn" (titel komt ook voor in `legBij`, `voegToe`, `naKaart`
  en `LEES`: wijzig alle vijf samen). Voorbeeldkaartjes met goud in 1.2 ("Voorbeeld: goud tellen",
  "Voorbeeld: de gouden ketting", `figKetting`): gram → mol → atomen, en de notatie 12,04·10²³ = 1,204·10²⁴. "Van gram naar mol" (CO₂, 33 g) doet alle drie de stappen: M uitrekenen (12,01 + 2 × 16,00), gram → mol, mol → moleculen, met "De n is de brug" (n zit in m = n × M én N = n × N_A) en "Moleculen of atomen?" (tel de deeltjes waar de stof uit bestaat). Leerpad 1.2 eindigt met "De drie formules op een rij" (N = n × N_A, m = n × M, ρ = m ÷ V; tabel `.frm`; ze haken in elkaar via n en m = het rekenschema). Ook 1.3 ("De formules van 1.3 op een rij": massa%, ppm, molariteit; `.frm.lang`) en 1.4 ("Alles samen: het stappenplan met formules") eindigen zo. Regel: elk voorbeeld laat zien waar de molaire massa vandaan komt (atoommassa's optellen), niets valt uit de lucht. Formules en N_A instampen: de **Formuleblitz**
  (`BLITZ.form`), ook als routestap in 1.2. Formules moet je kennen; N_A staat in Binas (tabel 7) maar is handig om
  te weten. Onder elke formule staat "Wat betekent wat?" (`leg(keys)`, `SYM`: symbool,
  betekenis, eenheid), op de theorie (`TH.*.h`) en via `legBij` op leerpad-kaartjes. Stel bij een vraag van Marcel
  over de stof eerst vast of het al ergens uitgelegd staat; ontbreekt het, stel dan een kaartje voor.
- **Kleuren op het hoofdscherm** (alle vakken met een route): **donker** (`mode main`) alleen voor de kaart van de
  leerroute; **wit** = nog te doen; **groen met "✓ gehaald"** (klasse `gehaald`) = gehaald volgens hetzelfde doel als
  in de route. `GEHAALD()` per pagina (helpers `stp`, `alleKlaar`, `zetG`), aangeroepen via `markeer` vanuit
  `routeBox`. Nieuwe knop op het hoofdscherm? Zet hem in `GEHAALD()`, en geef hem geen `main`.
- Opgeslagen voor de route: `S.tr[gen]` (beste reeks), `S.pr[sec]` (beste oefenronde, fractie), `S.flits`.
- **Frans versie 5** (`frans-5.html`): kopie van de combi (zelfde opslag `frans-ch1-combi`) met woordjespad en
  blok Spelletjes. Spelletjes openen `frans-spel.html#v5=<spel>&set=<pagina's>`; die gaat daarna terug naar
  `frans-5.html` (via `sessionStorage['v5-rt']` weer naar het pad). "Gekend" = niveau ≥ 3 in de combi (`S.w[id]`)
  óf in de spelletjes (`frans-spel-v1`, `S.w[Franse tekst]`). Wijzig je de combi, kijk of versie 5 mee moet.

## Leerlogboek en scores (gedeeld met deweef/spelletjes)
- `leerlog.js` staat in de `<head>` van elke vakpagina (vóór de andere scripts). Per bezoek stuurt het stil één
  regel (wie, vak, actieve minuten, wat erbij kwam, stand) met `sendBeacon` naar het Apps Script van het
  scorebord: `BORD_URL` in `deweef/spelletjes`, code in `extra/scorebord.gs` (`doPost`, `actie=leer`).
  Tabblad 'Leerhoek' in Marcels Google-spreadsheet. Ben en Dana mogen hier niets van merken: geen meldingen.
- Marcel kijkt mee in de **Scores-app**: https://deweef.github.io/spelletjes/scores/ (code in de
  spelletjes-repo, met geheim woord). Lees voor het script en de app de `CLAUDE.md` van deweef/spelletjes.
- Een nieuwe vakpagina: zet `<script src="leerlog.js"></script>` in de head, gebruik een eigen KEY, zet het
  bestand in `VAK` van `scores/index.html` (spelletjes-repo) voor een mooie naam.
- Wijzig je `extra/scorebord.gs`: Marcel moet de code zelf in Apps Script plakken en
  Implementeren → Implementaties beheren → potlood → **Nieuwe versie** kiezen (niet "Nieuwe implementatie",
  dan verandert de URL). Zet de volledige code dan in de chat.

## Werkwijze
- **Werk deze CLAUDE.md bij in dezelfde commit als de wijziging** (nieuw onderdeel, nieuwe afspraak, of een les uit
  een fout), zodat een nieuwe sessie altijd de laatste stand kent.
- Wijzigingen direct op `main` (dan staat het binnen een minuut live), maar pas na een test in de browser.
- Testen: start een `http.server.ThreadingHTTPServer` (met `request_queue_size = 128`) in de map en gebruik
  Playwright met Chromium (`executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'`,
  `args: ['--headless=new']`). Zet in `addInitScript` `leren-ok` (de hash uit `index.html`) en `leren-wie`.
  script.google.com is vanuit de cloud niet bereikbaar: vang het af met `context.route` en een nagemaakt
  antwoord. Let op fouten in de console.
- Na een grote wijziging: kort uitleggen wat er te zien is, in gewone taal (Marcel is geen programmeur).
- Lesstof voor een nieuw vak: Marcel zet foto's of pdf's van het boek in OneDrive onder
  `Documenten/Claude Code/Leren/<vak>/`. Haal ze daar zelf op met de Microsoft 365-connector
  (`sharepoint_folder_search` / `read_resource`) in plaats van om uploads te vragen.

## Valkuilen (uit eerdere fouten)
- Meerkeuze-opties altijd husselen. `opt4()` zet het goede antwoord vooraan; `ask()` husselt zelf, maar wie opties
  rechtstreeks met `mcButtons()` toont moet `shuffle()` gebruiken (de Kolommentabel had altijd het goede antwoord
  bovenaan).
- Code die midden in het script draait mag nog geen `$`, `S` of andere `const`'s van verderop gebruiken (dan stopt
  het hele script: "Cannot access '$' before initialization"). Koppel knoppen in `renderHome`/`routeBox`, of zet
  de code onderaan.
- Controleer of een klassenaam al bestaat voordat je hem gebruikt (`.drie`, `.kc` en `.bk` waren al bezet in H1).
  In `engels.html` heeft `.gt` een `min-width:480px`: gebruik voor smalle tabellen een eigen klasse.
- Tabellen in een smalle kolom: de algemene regel `overflow-wrap:anywhere` breekt woorden middendoor; zet hem lokaal
  uit, of zet de tabel buiten de lijst op volle breedte.
- Iets toevoegen aan `TH.*.h` komt ook terecht in kaartjes die die theorie al overnemen (`${TH.schema.h}` in
  "Het rekenschema", `TH.gehalte.h` in "Gehaltes"): voeg het daar dan niet nog eens toe (dubbel).
- Gebruik in een kaartje geen begrip dat pas later uitgelegd wordt ("En M (molair)" in 0b rekende met mol, die pas in
  1.2 komt; Ben snapte het niet). Noem het dan kort ("leer je in 1.2") en houd het bij het rekentrucje. Voorbeelden in
  genummerde stappen met wat je uitrekent ("mL naar liter", "per liter"), plus een "snap je het zo?"-check in gewone taal.
- Bekijk nieuwe schermen altijd op telefoonbreedte (390 px), in licht én donker, voordat je ze live zet.
