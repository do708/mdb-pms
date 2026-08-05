# Reisuren, kilometers & projecten — richtlijnen

> Product- en technische feedback na de bouw van automatische km, dagroutes,
> project-uren, monteur-toegang en rapportages (aug 2026).
> **Geldt voor alle rollen (PO, architect, developer, tester) en Cursor-agents.**

---

## 1. Wat we hebben gebouwd (kort)

| Onderdeel | Gedrag |
|-----------|--------|
| **Werkbon planning** | Bij geplande datum + adres: rit kantoor ↔ klus. Meerdere werkbonnen op één dag: kantoor → klus1 → klus2 → … → kantoor. |
| **Voorrijtarief** | **Vast** = geen km/reisuren. **KM's + Uren** = km + reistijd (kloknotatie). |
| **Project-uren** | Monteur (en collega’s) boeken uren. Project-km = **alleen** projectlocatie, **niet** andere werkbonnen die dag. |
| **Rapportages** | Totaal gereden per monteur/dag = gecombineerde dagroute (alle stops). |
| **Monteur UI** | Ziet actieve projecten, boekt uren, ziet uren per monteur. Geen offerte, budget of materialen. |
| **Excel-export** | Alleen kantoor/admin; MDB-kleuren (blauw / geel / roze). Urenlog: Geboekt door / Geboekt op. |
| **Audit project-uren** | `bookedByUserId` = wie boekte; `userId` = voor wie; `createdAt` = wanneer. Zichtbaar in urenlog + Excel. |

**Kantooradres:** Monitorweg 10, Almere (of `MDB_OFFICE_ADDRESS`).

**Klokuren:** `1.30` = 1 uur 30 minuten (geen decimale uren). Toegestaan: `.00` / `.15` / `.30` / `.45`.

---

## 2. Twee betekenissen van “kilometers” (cruciaal)

Houd dit scherp in UI-teksten en code:

| Context | Betekenis |
|---------|-----------|
| **Rapportage / “werkelijk gereden”** | Één dagroute voor de monteur: alle stops die dag (werkbonnen + projecten). |
| **Project-urenlog / werkbon-tarief** | Alleen de km die bij **die** klus/project horen (zaak ↔ die locatie), niet de rest van de dag. |

Zonder uitleg denken kantoor en monteurs dat dezelfde kolom hetzelfde betekent. Zet korte hulptekst op Rapportages en op het project-urenlog.

---

## 3. Aanbevolen verbeteringen (prioriteit)

### P0 — doen eerst

1. **Eén bron van waarheid voor travel** — **done**  
   Km/reistijd opslaan bij plannen/uren boeken. Geen herberekening bij project-GET. Herbreek alleen bij adreswijziging. Route/geocode-cache (`TravelRouteCache` / `TravelGeocodeCache`, MD5-sleutel).

2. **Audit bij uren boeken voor collega’s** — **done**  
   `bookedByUserId` + `createdAt`; zichtbaar in project-urenlog en Excel-export.

### P1 — daarna

3. **Intern: minuten of decimale uren; UI: kloknotatie** — **done**  
   `parseHoursInput` → decimale uren in DB; `formatHoursDisplay` / `formatClockHours` alleen in UI/Excel.

4. **Voorrijtarief in code hernoemen**  
   Boolean “Ja/Nee” is verwarrend. Liever `voorrijModus: "vast" | "km"`.

5. **Locatie verplicht (of waarschuwing) voor km** — **done**  
   Zachte confirm bij nieuw project zonder adres.

6. **Cache voor routing/geocoding** — **done**  
   Persistent cache per adrespaar (MD5).

### P2 — nice to have

7. **“Stops vandaag” per monteur** — overzicht van de dagroute.
8. **Maandfilter** op Rapportages (niet alleen “deze maand”).
9. **Twee kolommen in rapportages:** declarabele km vs werkelijk gereden.
10. **Monteur:** “mijn uren deze week” op de projectenlijst.

---

## 4. Spelregels voor nieuwe features

- Wijzig travel-logica niet alleen in de UI: werkbon, project-uren, sync en rapportages moeten **dezelfde regels** volgen.
- Monteurs zien **geen** offertebedragen, geoffreerde uren of materiaalkosten.
- Project-km **nooit** delen met werkbon-km van dezelfde dag.
- Rapportage-dagroute **wel** alle stops van die monteur die dag.
- Nieuwe velden voor uren/reistijd: altijd **intern numeriek**, display apart.
- Nederlandse UI-teksten; korte uitleg bij km/reistijd waar verwarring kan ontstaan.

---

## 5. Relevante code (oriëntatie)

| Pad | Rol |
|-----|-----|
| `src/lib/travel/plannedKilometers.ts` | Geocoding, OSRM, dagroute, format/parse helpers |
| `src/lib/travel/syncEngineerDayKilometers.ts` | Opslaan km/reistijd (werkbonnen vs projecten gescheiden) |
| `src/types/oplever.ts` | `enforceVoorrijtariefTravelRules`, klokuren |
| `src/app/api/reports/route.ts` | Rapportages (uren + km + reistijd) |
| `src/app/api/projects/[id]/uren/route.ts` | Uren boeken (meerdere monteurs) |
| `src/lib/projects/serialize.ts` | Engineer-veilige project-payload |
| `src/auth.config.ts` | Monteur mag `/projects` |
| `src/lib/projects/exportWorkbook.ts` | Excel-export |

---

## 6. Productrisico #1

Zonder korte interne uitleg (“project-km = alleen projectlocatie; rapportage = hele dag”) blijven dezelfde getallen verschillend geïnterpreteerd. **Hulptekst op twee plekken** levert meer op dan een nieuwe feature.

---

*Laatste update: 5 augustus 2026*
