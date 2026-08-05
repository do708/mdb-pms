# MDB PMS — Project Management Systeem

> Centraal referentiedocument. **Lees dit eerst** voordat je code schrijft of wijzigt.
> Dit is de "single source of truth" voor architectuur, conventies en spelregels.

---

## 1. Wat is dit?

MDB PMS is een intern platform voor **MDB Networks**, een installatiebedrijf voor
digital signage / narrowcasting. Het systeem beheert de volledige stroom van
aanvraag → werkbon → planning → uitvoering → oplevering → facturatie, over drie
rollen heen: **admin**, **office** (kantoor) en **engineer** (monteur).

De opdrachtgever (klant) kan via een publieke, login-vrije link zelf een aanvraag
indienen. Kantoor zet die om in een werkbon, plant een monteur in en verstuurt een
afspraakbevestiging. De monteur vult ter plaatse de werkbon/oplevering in. Kantoor
factureert en archiveert.

---

## 2. Tech Stack

| Laag            | Keuze                                                            |
|-----------------|-----------------------------------------------------------------|
| Framework       | Next.js 16.2.11 (App Router, Turbopack)                         |
| Taal            | TypeScript (strict)                                              |
| UI              | React + Tailwind CSS                                             |
| ORM             | Prisma 7.9.0 — client gegenereerd naar `./src/generated/prisma` |
| Adapter         | PrismaPg (`@prisma/adapter-pg`)                                  |
| Database        | PostgreSQL 17 (lokaal) / Supabase (online)                      |
| Auth            | NextAuth (CredentialsProvider + bcryptjs)                       |
| Bestandsopslag  | Supabase Storage — bucket `workorder-files`                     |
| Mail            | Resend                                                           |
| PDF             | Puppeteer (`workorderHtmlPdf.ts`) + pdf-lib (`opleverPdf.ts`)   |
| Hosting         | Vercel (`pms.mdb-networks.nl`)                                   |
| Node            | v24.x                                                            |

**Belangrijk:** de app importeert de Prisma-client via `@/generated/prisma/client`,
niet via `@prisma/client`. De build draait `prisma generate && next build`.

---

## 3. Rollen

- **admin** — volledige toegang; beheer van gebruikers, klanten, formulieren.
- **office** (kantoor) — aanvragen verwerken, werkbonnen klaarzetten, plannen,
  afspraken versturen, factureren, projecten beheren.
- **engineer** (monteur) — eigen dashboard met openstaande werkbonnen; werkbon /
  oplevering invullen op locatie.

Login-afdwinging zit in `src/auth.config.ts` (authorized-callback). De matcher
staat in `src/proxy.ts`. De publieke aanvraagpagina (`/aanvraag`) is login-vrij.

---

## 4. Modules

Bestaand en werkend:

- **Aanvragen** — publiek portaal (`/aanvraag?client_id=TOKEN`), specificaties per
  type (Installatie / Storing / Uren), bijlagen, omzetten naar werkbon.
- **Werkbonnen** — aanmaken, klaarzetten, plannen, statusflow, PDF, mail.
- **Planning** — kalender / weekweergave, monteurs, Nederlandse feestdagen.
- **Klanten / Opdrachtgevers** — beheer (in de UI heet dit "Opdrachtgevers";
  code-identifiers blijven `customer*`).
- **Oplevering** — uitgebreid opleverformulier (schermen, videowall, kiosk,
  mediaplayers, audio, hardware-registratie, materialen, tarief).
- **Rapportages** — basis.

Gepland / in aanbouw:

- **Projecten** — grotere meerdaagse projecten met urenregistratie,
  budgetbewaking (geoffreerd vs. gebruikt), offerte-PDF, materiaalkosten,
  groen/rood-signaal. **Zie `docs/roadmap/Sprint-Projecten.md`.**
- **Magazijn / Materialen / Voertuigen / Facturatie** — toekomst.

---

## 5. Statusflow werkbon

`src/constants/workorderStatus.ts`:

1. `ontvangen` — Opdracht ontvangen
2. `afspraak` — Afspraak verstuurd
3. `ingepland`
4. `uitgevoerd`
5. `gefactureerd`
6. `afgerond`

Het monteur-dashboard (`/api/engineer`) toont alleen **openstaande** statussen
(t/m `ingepland`); `uitgevoerd`, `gefactureerd` en `afgerond` vallen weg en zijn
alleen zichtbaar via sidebar → Werkbonnen.

---

## 6. Code Rules (spelregels)

1. **Nooit bestaande functionaliteit breken.** Uitbreiden, niet vervangen.
2. **TypeScript strict** — geen `any` zonder reden, geen `@ts-ignore` als het
   anders kan.
3. **Prisma voor alle database-toegang** — geen ruwe SQL tenzij strikt nodig.
4. **Test na iedere wijziging** met `npm run build` (dit draait ook de
   type-check — dat is waar de meeste fouten opduiken).
5. **Geen dubbele componenten** — hergebruik bestaande (bijv. `MateriaalRij`,
   `Kop`, layout-componenten).
6. **Altijd responsive** (Tailwind, mobiel eerst waar relevant — monteurs werken
   op tablet/telefoon).
7. **Migraties bewust** — schema-wijziging = nieuwe Prisma-migratie; draai die
   ook online (Supabase) apart.
8. **Nederlandse UI-teksten.** Code-identifiers in het Engels/bestaande stijl.
9. **Nieuw veld op een werkbon?** Denk aan de lokaal handgeschreven
   `interface Workorder` in `src/app/engineer/workorders/[id]/page.tsx` — die
   importeert géén Prisma-types, dus voeg het veld daar óók toe.
10. **Codestijl:** het bestaande project gebruikt veel witregels en ruime
    spatiëring. Volg de stijl van omringende code.

---

## 7. Belangrijke valkuilen (uit ervaring)

- **Lokaal ≠ online database.** Een aanvraag-token dat lokaal werkt, bestaat niet
  online en omgekeerd. Test in dezelfde omgeving als waar je de link kopieert.
- **`opleverPdf.ts` (pdf-lib)** is geschreven tegen de opleverdatastructuur; als
  `src/types/oplever.ts` verandert, controleer dit bestand op verwijzingen naar
  hernoemde/verplaatste velden (schermen zitten in `nieuweFormaten` /
  `hergebruikteFormaten` als `SchermBlok[]`; kosten in `ExtraKosten`-objecten met
  `.kosten`).
- **PDF op Vercel** werkt (nog) niet serverless — Puppeteer heeft geen Chrome in
  de serverless-omgeving. Oplossing (todo): `puppeteer-core` + `@sparticuz/chromium`
  met VERCEL-detectie. De monteur-flow negeert een PDF-fout stil (kantoor krijgt
  de mail via de complete-stap).
- **Prisma-client pad:** importeer uit `@/generated/prisma/client`.
- **Unicode bij plakken van env-waarden** in de terminal kan een verborgen
  line-separator (`%E2%80%A8`) toevoegen aan bijv. de databasenaam. Typ env-URLs
  met de hand.

---

## 8. Belangrijke bestanden

| Bestand                                              | Rol                                        |
|------------------------------------------------------|--------------------------------------------|
| `prisma/schema.prisma`                               | Datamodel                                  |
| `src/auth.config.ts`                                 | Login-afdwinging (authorized-callback)     |
| `src/proxy.ts`                                        | Route-matcher                              |
| `src/constants/workorderStatus.ts`                   | Statusflow                                 |
| `src/types/oplever.ts`                               | Opleverdata-typen (SchermBlok, ExtraKosten, HardwareRegel, klaarzetMateriaal) |
| `src/lib/klaarzetMateriaal.ts`                       | Materiaal-controle klaarzetten             |
| `src/lib/holidays.ts`                                | NL feestdagen + `isWerkdag` / `volgendeWerkdag` |
| `src/lib/pdf/opleverPdf.ts`                          | Oplever-PDF (pdf-lib)                       |
| `src/lib/pdf/workorderHtmlPdf.ts`                    | Werkbon-PDF (Puppeteer)                     |
| `src/app/aanvraag/page.tsx`                          | Publiek aanvraagformulier                  |
| `src/app/dashboard/page.tsx` + `/api/dashboard`      | Kantoor-dashboard (incl. materiaal-waarschuwing) |
| `src/app/engineer/page.tsx` + `/api/engineer`        | Monteur-dashboard                          |
| `src/app/engineer/workorders/[id]/page.tsx`          | Monteur werkbon-invulscherm                |
| `src/app/workorders/[id]/edit/page.tsx`              | Kantoor werkbon klaarzetten/bewerken       |
| `src/components/workorders/OpleverForm.tsx`          | Opleverformulier (incl. hardware-tabel)    |
| `src/components/layout/Sidebar.tsx`                  | Navigatie                                  |

---

## 9. Deploy

- Code: GitHub `do708/mdb-pms` → Vercel (auto-deploy op push naar main).
- Migraties online: `DATABASE_URL="$ONLINE_DB" npx prisma migrate deploy`
  (pooler poort 5432 voor migraties; app gebruikt poort 6543 + `?pgbouncer=true`).
- `NEXTAUTH_URL` online = `https://pms.mdb-networks.nl`.

---

## 10. Werkwijze met de AI (in Cursor)

- Laat de AI dit `PROJECT.md` en de relevante `docs/agents/*.md` eerst lezen.
- Werk **gefaseerd**: datamodel → backend → frontend → test. Eén samenhangend
  stuk per keer.
- Na elke wijziging: `npm run build`. Los type-fouten op vóór de volgende stap.
- Grote features (zoals Projecten) hebben een eigen sprint-document in
  `docs/roadmap/`.
