# Openstaande punten (kleiner)

Losse verbeteringen die nog open staan. Elk is een op zichzelf staande wijziging.

## Travel / projecturen (zie ook `architecture/Travel-en-projecturen.md`)

- **P0:** Travel één keer opslaan bij plan/uren-boek; geen stille herberekening-drift. ~~Deels done~~ (geen sync bij project-GET; cache + opslaan bij boek/plan).
- ~~**P0:** Auditveld bij project-uren: wie boekte vs voor wie.~~ Done (`bookedByUserId` + `createdAt` in UI/Excel).
- ~~**P1:** Intern minuten/decimale uren; kloknotatie alleen in UI.~~ Done (`parseHoursInput` / `formatHoursDisplay`).
- **P1:** `voorrijModus: vast | km` i.p.v. boolean-semantiek.
- ~~**P1:** Locatie-validatie voor km; cache geocode/route.~~ Done (zachte waarschuwing + `TravelRouteCache` / `TravelGeocodeCache`).
- **P2:** Stops-van-de-dag; maandfilter rapportages; declarabel vs werkelijk gereden.

## Hardware-tabel — Fase 2 (automatische koppeling)
De "Benaming"-kolom bestaat nu in de hardware-tabel (`OpleverForm.tsx`,
`HardwareRegel.benaming`). **Nog te doen:** bij het openen van een werkbon
automatisch hardware-regels genereren met de benaming alvast ingevuld ("Scherm 1",
"Scherm 2", "Mediaplayer 1", …) op basis van de aanvraag-/opleverdata (de nummering
komt uit de index van de schermblokken; zie `OpleverForm.tsx` "Scherm {index+1}" en
`workorderHtmlPdf.ts`). Monteur vult dan alleen merk/type/serienummer/MAC in.

## Werkbon bewerken — "hele dag"-checkbox
Op de werkbon-wijzigen-pagina (`/workorders/[id]/edit`) mist bij **Tijdstip** een
checkbox "hele dag" (naast Van–Tot).

## Materialenlijst — doorlopende nummering
In "gebruikte materialen" (monteur-invulscherm) heeft "Extra switches gebruikt"
géén nummer terwijl de rest doorloopt (1 TV beugels, 2 HDMI, 3 patchkabels,
switches [geen nr], 4 UTP, …). Moet doorlopend genummerd.

## Handtekening — automatische contactpersoon-naam
Bij "Handtekening voor akkoord" moet het veld "Naam contactpersoon" automatisch
gevuld worden met de contactpersoon uit de aanvraag (bovenin), maar aanpasbaar
blijven.

## "Anders" bij formaat-dropdown
De formaat-dropdown (Schermen/Videowall op het aanvraagformulier) heeft nu "Anders"
als optie. Optioneel: bij keuze "Anders" een tekstvakje tonen om het afwijkende
formaat in te typen (vereist aanpassing in de rendering, niet alleen de
velddefinitie).

## PDF op Vercel (serverless)
Puppeteer-PDF werkt niet serverless op Vercel (geen Chrome). Oplossing:
`puppeteer-core` + `@sparticuz/chromium` met VERCEL-detectie. De monteur-flow
negeert een PDF-fout nu stil (kantoor krijgt de mail via de complete-stap).

## Opslag-migratie (later)
Supabase Storage → eigen NAS (4 TB) voor bestanden/PDF's.
