# Openstaande punten (kleiner)

Losse verbeteringen die nog open staan. Elk is een op zichzelf staande wijziging.

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
