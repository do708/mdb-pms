# Auth-herstel — 24 juli 2026

Alles hieronder is al doorgevoerd in deze zip. Dit document legt uit wát er veranderd is en waarom, zodat je het kunt nalezen of terugdraaien.

---

## 1. De oorzaak van "login blijft niet behouden"

`src/lib/auth/session.ts` bewaarde de ingelogde gebruiker in een gewone variabele:

```ts
let currentUser: SessionUser | null = null;
```

Dat is geen sessie. Gevolgen:

- Er werd **geen cookie** gezet. Na de redirect wist de browser niets meer.
- De variabele was **gedeeld tussen alle bezoekers**. Logde een monteur in, dan werd de admin die net inlogde óók die monteur. Dat is een lek, geen bug.
- Op Vercel draait elke request mogelijk op een andere instance, dus de waarde was daar sowieso weg.
- `dashboard/page.tsx` is `"use client"` en riep `getCurrentUser()` aan. In de browser is die variabele altijd `null` → "Geen toegang", wie je ook was.

Daarnaast draaiden er **twee auth-systemen naast elkaar**: NextAuth v5 stond correct geconfigureerd in `src/auth.ts`, maar de loginpagina postte naar je eigen `/api/auth/login` en raakte NextAuth nooit aan. Daarom deed `signOut()` in het UserMenu ook niets.

---

## 2. Wat er is gewijzigd

### Nieuw

| Bestand | Doel |
|---|---|
| `src/auth.config.ts` | Edge-veilige NextAuth-config (geen Prisma, geen bcrypt) — wordt door de proxy gebruikt. Bevat ook alle routebeveiliging in de `authorized` callback. |
| `src/lib/auth/guard.ts` | `requireApiRole([...])` voor rolcontrole in API-routes. |

### Vervangen

| Bestand | Wat |
|---|---|
| `src/auth.ts` | Bouwt nu voort op `auth.config.ts`, gebruikt de gedeelde Prisma-client, `bcryptjs`, en vergelijkt altijd een hash (ook als het account niet bestaat) zodat de responstijd niet verraadt welke e-mailadressen bestaan. |
| `src/proxy.ts` | Importeert alleen `auth.config` (anders crasht de middleware-runtime op Prisma). Matcher dekt nu de hele app in plaats van alleen `/dashboard`. |
| `src/lib/auth/session.ts` | Globale variabele eruit. Nu `getCurrentUser()`, `requireUser()` en `requireRole()` op basis van de echte NextAuth-sessie. Alleen server-side. |
| `src/lib/prisma.ts` | Singleton, anders maakt Next bij elke hot-reload een nieuwe connectiepool aan. |
| `src/app/login/page.tsx` | Gebruikt `signIn("credentials", { redirect: false })`. Foutmelding in beeld i.p.v. `alert()`, Enter-toets werkt, `autoComplete` ingesteld. |
| `src/app/page.tsx` | Stuurt door naar `/dashboard` of `/engineer` op basis van rol. |
| `src/components/layout/AppShell.tsx` | Verbergt sidebar/header op `/login` en in `/engineer`. |
| `src/components/layout/UserMenu.tsx` | Toont de echte naam en rol i.p.v. hardcoded "Administrator". |
| `src/components/layout/Sidebar.tsx` | "Gebruikers" toegevoegd; Gebruikers en Instellingen alleen zichtbaar voor admin. |
| `src/app/api/users/route.ts` | Admin-guard, e-mail-uniekheidscheck, minimaal 8 tekens, rolvalidatie. |
| `src/app/api/users/[id]/route.ts` | Admin-guard, **wachtwoord reset** (`PUT` met `password`), **DELETE**, en je kunt jezelf niet verwijderen of je eigen adminrechten intrekken. |
| `src/app/api/dashboard/route.ts` | Guard op `admin` + `office`. |
| `src/app/dashboard/page.tsx`<br>`src/app/users/page.tsx`<br>`src/app/engineer/page.tsx` | Rolcontrole via `useSession()`. De hardcoded `const userRole = "admin"` was een dode check. |

### Verwijderd

- `src/app/api/auth/login/` — de concurrerende loginroute.
- `bcrypt` en `@types/bcrypt` uit `package.json`. De native `bcrypt` compileert niet betrouwbaar op Vercel; alles draait nu op `bcryptjs`.
- `build-error.txt`, `error.log`, `tsconfig.tsbuildinfo`, alle `.DS_Store`.

---

## 3. Rechtenmatrix (nu afgedwongen in `auth.config.ts`)

| Route | admin | office | engineer | uitgelogd |
|---|:--:|:--:|:--:|:--:|
| `/login` | → `/` | → `/` | → `/` | ✅ |
| `/` | → `/dashboard` | → `/dashboard` | → `/engineer` | → `/login` |
| `/dashboard`, `/workorders`, `/projects`, … | ✅ | ✅ | → `/engineer` | → `/login` |
| `/users`, `/settings` | ✅ | → `/dashboard` | → `/engineer` | → `/login` |
| `/engineer/*` | ✅ | ✅ | ✅ | → `/login` |
| `/api/*` | ingelogd = door; rol wordt per route gecheckt | | | `401 JSON` |

API-routes worden bewust niet op rol gefilterd in de proxy — anders zouden de fetch-calls uit de monteuromgeving worden omgeleid naar een HTML-pagina. Rolcontrole hoort daar in de route zelf.

---

## 4. Eerste keer opstarten

```bash
npm install          # synchroniseert de lockfile na het verwijderen van bcrypt
npx prisma generate
npm run dev
```

`AUTH_SECRET` staat al in je `.env`. Voor productie een nieuwe genereren:

```bash
openssl rand -base64 32
```

---

## 5. Testlijst

1. `/dashboard` zonder login → springt naar `/login`
2. Inloggen als admin → landt op `/dashboard`, naam en rol staan rechtsboven
3. **F5 drukken → je blijft ingelogd** ← dit was de kern van het probleem
4. Inloggen als engineer → landt op `/engineer`; `/dashboard` intikken stuurt terug
5. Engineer ziet geen "Gebruikers" in het menu; office ook niet
6. Uitloggen → terug naar `/login`, `/dashboard` is weer dicht
7. `/api/users` in een incognitovenster → `401`
8. Als office ingelogd `/api/users` opvragen → `403`

Cookie controleren: DevTools → Application → Cookies → `authjs.session-token` moet er staan.

---

## 6. Nog open

**Nog niet afgedicht:** de overige API-routes (`/api/workorders`, `/api/projects`, `/api/customers`, `/api/planning`, `/api/documents`, `/api/upload`, `/api/assignments`, `/api/engineer`). De proxy blokkeert daar wél uitgelogde requests, maar er is nog geen rolonderscheid. Het patroon staat klaar:

```ts
import { requireApiRole } from "@/lib/auth/guard";

export async function GET() {
    const guard = await requireApiRole(["admin", "office"]);
    if (!guard.ok) return guard.response;

    // guard.user.id / guard.user.role beschikbaar
}
```

**Voor Vercel:** zet `AUTH_URL` op je live domein. Zonder die variabele werken de cookies achter een custom domein niet goed.

**Sleutels roteren:** je `.env` zat in de gedeelde zip. De `SUPABASE_SERVICE_ROLE_KEY` omzeilt alle row-level security. Die en de Resend-key zou ik vervangen voordat je live gaat.
