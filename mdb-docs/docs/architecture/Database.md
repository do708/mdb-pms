# Database — architectuuroverzicht

> Levend document. Werk dit bij bij elke migratie.

## Client & adapter
- Prisma 7.9.0, client gegenereerd naar `./src/generated/prisma`.
- Geïmporteerd via `@/generated/prisma/client`.
- PrismaPg-adapter, PostgreSQL 17.
- Lokaal: eigen Postgres. Online: Supabase (`pwhxwyxzxepmopskzqpy`, eu-west-1).

## Kernmodellen (samengevat)
- **User** — rollen admin/office/engineer; bcrypt-wachtwoord.
- **Customer** — opdrachtgever; `publicToken` (uniek) voor het aanvraagportaal.
  In de UI "Opdrachtgever" genoemd; code blijft `customer*`.
- **Workorder** — werkbon; o.a. `status`, `plannedDate`, `startTime`,
  `assignedUserId` (hoofdmonteur), `formData` (JSON, bevat opleverdata +
  `klaarzetMateriaal`), `projectId` (relatie naar Project), `internalNotes`,
  contactvelden.
- **Project** — bestaat al als relatie op Workorder (`project { customer }`).
  **Wordt uitgebreid voor de Projecten-module** — zie
  `docs/roadmap/Sprint-Projecten.md`.
- **WorkorderForm** / **FormType** — welk formulier de monteur invult
  (FORM_DEFINITIONS).
- **Document** — bijlagen (type o.a. `"aanvraag"`), Supabase Storage.
- **Aanvraag** — publieke aanvraag (customerId, locatie-velden, `specificaties`
  JSON, `bijlagen` JSON, `aanvragerNaam`, `status`).

## Opleverdata (in `Workorder.formData`, JSON — types in `src/types/oplever.ts`)
- `installatie` — schermen (`nieuweFormaten` / `hergebruikteFormaten` als
  `SchermBlok[]`), `videowall`/`kiosk`/`audio` (booleans), `mediaplayers`
  (keuze-tekst), enz.
- `hardware: HardwareRegel[]` — `actie`, **`benaming`** (Scherm 1, …), `merk`,
  `type`, `serienummer`, `macAddress`.
- `klaarzetMateriaal` — schermen/players/beugels/**kiosk**/versterkers, elk met
  `*Aantal` / `*Geleverd` / `*Klaargezet`.
- `tarief` — o.a. `parkeerkosten`/`materiaalkosten`/`sejour` als `ExtraKosten`
  (`{ actief, kosten, voorgeschoten }`).

## Migraties draaien
- Lokaal: `npx prisma migrate dev --name <naam>`.
- Online: `DATABASE_URL="$ONLINE_DB" npx prisma migrate deploy`
  (migraties via pooler poort 5432; app runtime poort 6543 + `?pgbouncer=true`).

## Migratielog
- `20260729000000_add_aanvraag` — Aanvraag-model + `Customer.publicToken`.
- `20260729100000_aanvraag_specificaties` — `aanvragerNaam` + `specificaties`.
- _(voeg nieuwe migraties hier toe met datum + korte omschrijving)_
