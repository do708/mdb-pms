# MDB PMS — docs

Deze map geeft de AI (en jou) houvast bij het doorontwikkelen van MDB PMS.

## Structuur
- `../PROJECT.md` — **start hier.** Visie, stack, modules, spelregels, valkuilen.
- `agents/` — rolinstructies. Vraag de AI een rol aan te nemen wanneer nuttig:
  - `product-owner.md` — features bedenken/afbakenen (geen code).
  - `architect.md` — ontwerp, datamodel, API, security (geen productiecode).
  - `database-engineer.md` — Prisma-schema + migraties.
  - `developer.md` — productieklare full-stack code.
  - `tester.md` — controleren dat het werkt en niets breekt.
- `architecture/Database.md` — datamodel-overzicht + migratielog.
- `architecture/Travel-en-projecturen.md` — **km, reisuren, project-uren, rapportages:** spelregels + backlog.
- `roadmap/Sprint-Projecten.md` — volledige spec van de Projecten-module.
- `roadmap/Openstaand.md` — kleinere openstaande punten.

## Zo gebruik je dit in Cursor

1. Open de map `mdb-pms` in **Cursor**.
2. Zorg dat `PROJECT.md` en `docs/` in de repo staan (op GitHub committen is slim).
3. Begin een taak met een verwijzing, bijvoorbeeld:

   > Lees `PROJECT.md` en `docs/roadmap/Sprint-Projecten.md`. Neem de rol uit
   > `docs/agents/architect.md` aan en ontwerp Fase 1 (datamodel) van de
   > Projecten-module. Schrijf nog geen code.

4. Daarna:

   > Neem nu `docs/agents/database-engineer.md`. Implementeer het ontwerp: pas
   > `prisma/schema.prisma` aan en maak de migratie. Draai daarna `npm run build`.

5. En zo verder per fase: developer → tester.

De grote winst van Cursor: de AI ziet je **echte** bestanden en past ze direct aan.
Geen losse patch-scripts, geen out-of-sync kopie, geen grep-uitvoer plakken. Werk
gefaseerd en draai `npm run build` na elke stap.

## Eén gouden regel
Elke sessie/rol leest **eerst** `PROJECT.md`. Zo maken verschillende stappen geen
tegenstrijdige keuzes.
