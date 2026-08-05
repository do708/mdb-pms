# Sprint — Projecten-module

> Volledige spec voor de nieuwe Projecten-module. Bouw **gefaseerd**; elke fase is
> apart testbaar met `npm run build`. Lees `PROJECT.md` eerst.

## Doel

Grotere, meerdaagse projecten beheren met budgetbewaking. Kantoor maakt een project
aan (geoffreerde uren + bedrag, offerte-PDF, in te kopen materialen). Monteurs
boeken hun gewerkte uren per dag op een project. Op de projectpagina zie je in één
oogopslag: geoffreerd vs. daadwerkelijk gebruikt (uren én materiaalkosten), met een
**groen/rood-signaal** of je binnen budget loopt.

Voorbeeld: project "Roza Spier, Laren". Monteur werkt er meerdere dagen; boekt "5e:
8 uur op Roza Spier". Kantoor ziet lopende uren tegen de geoffreerde uren.

## Sidebar
Nieuwe regel **Projecten** onder "Werkbon invullen".

---

## Fase 1 — Datamodel (fundament)

Er bestaat al een `Project`-relatie op `Workorder`. Bouw daarop voort; hernoem of
verwijder niets bestaands.

Voorgesteld (Architect stemt definitief af):

- **Project** uitbreiden met:
  - `naam` (bijv. "Roza Spier")
  - `locatie` (bijv. "Laren")
  - `customerId` (opdrachtgever, relatie — bestaat mogelijk al)
  - `geoffreerdeUren` (Decimal/Float)
  - `geoffreerdBedrag` (Decimal) — optioneel
  - `offerteUrl` (String?) — Supabase Storage, net als bestaande Documents
  - `status` (bijv. actief / afgerond) — optioneel
  - `createdAt`
- **ProjectUren** (nieuw model) — één regel per boeking:
  - `projectId`, `userId` (monteur), `datum`, `uren`, `omschrijving?`
- **ProjectMateriaal** (nieuw model) — ingekocht materiaal:
  - `projectId`, `omschrijving`, `aantal?`, `kosten` (Decimal), `ingekochtOp?`

Regels: nieuwe velden op bestaande tabellen nullable/default zodat bestaande data
geldig blijft. Migratie lokaal én online.

**Testcriterium:** `npx prisma migrate dev` + `npm run build` groen.

---

## Fase 2 — Kantoor: project aanmaken & beheren

- Sidebar-regel "Projecten" (office/admin) → `/projecten`.
- Lijstpagina `/projecten`: alle projecten met samenvatting (naam, locatie,
  geoffreerde uren, gebruikte uren, groen/rood).
- Detail/aanmaak `/projecten/[id]` en `/projecten/new`:
  - Velden: naam, locatie, opdrachtgever, geoffreerde uren, geoffreerd bedrag.
  - Offerte-PDF uploaden (hergebruik de bestaande Supabase-upload / Document-flow).
  - Materiaallijst beheren (ProjectMateriaal: omschrijving, aantal, kosten).
- API-routes met `requireApiRole(["admin","office"])`.

**Testcriterium:** kantoor kan een project aanmaken, offerte uploaden, materialen
toevoegen; alles blijft bewaard.

---

## Fase 3 — Monteur: uren boeken op een project

- In het monteur-invulscherm (of een aparte "Uren"-actie): kies een project +
  datum + aantal uur + optionele omschrijving → schrijft een `ProjectUren`-regel.
- Alleen projecten met status "actief" tonen.
- Eenvoudig en snel (monteur op tablet).

**Testcriterium:** monteur boekt uren; ze verschijnen bij het project.

---

## Fase 4 — Overzicht & budgetbewaking

Op `/projecten/[id]`:

- **Uren:** geoffreerd vs. som van `ProjectUren.uren`. Balk/percentage.
- **Materiaal:** som van `ProjectMateriaal.kosten`; indien `geoffreerdBedrag`
  bekend, kosten vs. budget.
- **Signaal:** groen als binnen geoffreerde uren/bedrag, oranje bij ~80–100%,
  rood bij overschrijding.
- Offerte-PDF inzien/downloaden.

**Testcriterium:** het overzicht klopt met de geboekte uren en materiaalkosten en
kleurt correct.

---

## Fase 5 (optioneel, later) — Excel-export

Export van de urenregels per project naar `.xlsx` (bijv. voor de boekhouding).
Alleen bouwen als de in-app-overzichten niet volstaan.

---

## Raakvlakken / let op
- `Workorder` heeft al `projectId` — koppel werkbonnen en projecturen consistent.
- Hergebruik de bestaande upload-/Document-flow voor de offerte-PDF.
- Rol-guards overal; monteur mag alleen boeken, niet budgetten wijzigen.
- Bedragen: gebruik `Decimal` in Prisma voor geld/uren om afrondingsfouten te
  voorkomen.
