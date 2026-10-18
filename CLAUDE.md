# Leerhoek – instructies voor Claude Code

## Wat dit is
Een oefensite voor Ben en Dana (havo/vwo), gehost via GitHub Pages op https://deweef.github.io/leren/.
Doel: leren makkelijker en leuker maken. Alles in het Nederlands, kort en vriendelijk. Marcel (de ouder)
bouwt het samen met Claude; hij wil ook zelf kunnen meeleren (scheikunde: hij begon met 0 voorkennis).

- `index.html`: wachtwoord (SHA-256 in `H`, alleen een drempel: de repo is openbaar), daarna "Wie ben jij?"
  (`leren-wie` = `ben`, `dana` of `alle` = Ouder) en per persoon kaarten naar de vakken. Elke vakpagina stuurt
  zonder `leren-ok` terug naar `index.html`.
- Elk vak is één los HTML-bestand (geen build, geen CDN behalve Google Fonts), met voortgang in localStorage:
  `engels.html` (Ben, `unit3-trainer-v1`), `biologie.html` (Ben, `bio-thema1-v1`), `wiskunde.html` (Ben, H2
  statistiek, `wis-h2-v1`), `scheikunde-h1.html` (H1 chemisch rekenen, `chem-h1-v1`), `scheikunde.html` (H2
  bindingen, `chem-h2-v1`), Frans voor Dana: `frans.html`, `frans-copilot.html`, `frans-combi.html`,
  `frans-spel.html` (spelletjes), `frans-5.html` (versie 5, zie onder).
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
  `figMolair`, `figBehoud`, `figTosti`; klasse `.lpfig`). Formules en N_A instampen: de **Formuleblitz**
  (`BLITZ.form`), ook als routestap in 1.2. Formules moet je kennen; N_A staat in Binas (tabel 7) maar is handig om
  te weten. Stel bij een vraag van Marcel
  over de stof eerst vast of het al ergens uitgelegd staat; ontbreekt het, stel dan een kaartje voor.
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
- Bekijk nieuwe schermen altijd op telefoonbreedte (390 px), in licht én donker, voordat je ze live zet.
