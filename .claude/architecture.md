# Arquitectura (Paw) — cómo está cableada la app

Mapa mental para no romper cosas. El detalle de UI/diseño y capa de datos está en
`docs/build-context.md`; esto cubre **auth, Supabase, middleware y rutas**, que es donde
una sesión nueva suele equivocarse.

## Los 4 clientes de Supabase (usar el correcto según el contexto)

`src/lib/supabase/`:

| Archivo | Cliente | Dónde se usa | Clave |
|---|---|---|---|
| `client.ts` | **Browser** (`createBrowserClient`) | Componentes `"use client"` | anon |
| `server.ts` | **Server** (`createServerClient` + cookies) | Server Components, rutas API, `route.ts` | anon (sesión por cookie) |
| `middleware.ts` | **Middleware** (`updateSession`) | solo `src/middleware.ts` | anon |
| `admin.ts` | **Admin** (`service_role`) | **solo** server (API routes, tareas admin) | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ **`admin.ts` NUNCA al browser.** Usa `service_role` (salta RLS). Solo en código de servidor.
> ⚠️ No uses el **browser client** en server ni viceversa — las cookies/sesión no fluyen igual.

## Sesión y guard de rutas (`src/middleware.ts` → `updateSession`)

- El middleware refresca la sesión en **cada request** y hace de **guard**: si no hay usuario y
  la ruta no es pública, **redirige a `/login`**.
- 🔴 **Regla literal del código:** *no agregar lógica entre `createServerClient` y `getUser()`*
  en `src/lib/supabase/middleware.ts`. Romperlo causa bugs de sesión intermitentes.
- 🔴 **Rutas públicas:** la lista `publicRoutes` vive en `src/lib/supabase/middleware.ts`.
  **Al crear una ruta nueva sin login (pública/compartida), AGRÉGALA ahí** o el middleware la
  mandará a `/login`. Públicas hoy: `/`, `/login`, `/register`, `/auth/callback`, `/join`,
  `/shared`, `/e`, `/demo`, `/politicas-de-privacidad`, `/manifest.webmanifest`, `/sw.js`.
- El `matcher` del middleware (en `src/middleware.ts`) excluye estáticos; no tocar sin razón.

## Auth en el cliente (`src/contexts/AuthContext.tsx`)

- `AuthProvider` expone `{ user, session, loading }` vía `useContext`. Escucha
  `onAuthStateChange`. Dispara `runPhotoMigration` al iniciar sesión.
- OAuth Google: **redirect + PKCE** (compatible con iOS PWA). Detalle en
  `docs/ios-pwa-oauth-spike.md`. Callback en `src/app/auth/callback`.

## Capa de datos (`src/lib/api/*`)

- Funciones por dominio: `pets`, `careCycles`, `businesses`, `bookings`, `events`, `lostPets`,
  `expenses`, `training`, `itinerary`, `notifications`, `vaccines`.
- **Degradación elegante:** si una tabla/func aún no existe en el proyecto (migración sin
  aplicar), usar `isMissingSchema(e)` de `src/lib/api/schemaErrors.ts` → estado vacío + un solo
  toast, **no** romper la pantalla. Patrón obligatorio al tocar datos.
- Estado global mínimo en Zustand (`src/store/index.ts`): mascotas y selección. Para datos de
  módulos, estado local / optimistic, **no** meter todo al store.

## Rutas (`src/app`, App Router)

- Con tab bar (4 destinos): `/home`, `/mascotas`, `/explorar`, `/citas`.
- Pantalla completa (sin tab bar): `/mascotas/nueva`, `/onboarding`, `/sos`, `/reservar`,
  `/negocios/*`, `/eventos/*`, `/asistente`, `/perdida`.
- **Públicas por token** (sin login): `/e/[token]` (ficha de emergencia de mascota perdida),
  `/shared/[token]`, `/join`.
- **Admin:** `/admin/business` (plataforma admin de negocios).
- **API routes:** `/api/account`, `/api/assistant`.
- Cada pantalla con datos debe tener `loading.tsx` (skeletons), estado vacío y error+reintentar.

## Tipos

`src/types/`: `db.ts` (tablas de las migraciones), `supabase.ts` (tipos generados), `index.ts`.

## Modo demo (sin Supabase)

`NEXT_PUBLIC_PAW_DEMO=1` o cookie `paw_demo=1` (o `/demo`) → **todos** los clientes Supabase
devuelven el `createDemoClient` (`src/lib/demo/`). Útil para ver la app sin BD. El middleware
también lo respeta (deja pasar sin guard).

## Tests

`src/__tests__/*.test.ts` (jest + ts-jest, `testEnvironment: node`). Correr `npx jest`.
Hay cobertura de `age`, `careCycles`, `demo`, `modules`, `petPortrait`. Al tocar lógica de
`src/lib/*`, correr jest y, si aplica, agregar/actualizar test.
