# Paw (petcare)

App de cuidado de mascotas (**PFM**: pet family management). **Single-tenant** — una sola
marca, un solo dominio, un solo bundle. **No** es multi-tenant/white-label como Gym.

> ## 📱 Es un PWA (Next.js), NO Capacitor (todavía)
>
> Hoy Paw es una **web app / PWA** (Next.js 15 App Router) que se despliega en **Vercel** y
> se instala desde el navegador ("Añadir a pantalla de inicio"). El OAuth de iOS está
> resuelto por **redirect + PKCE** (ver `docs/ios-pwa-oauth-spike.md`), no por app nativa.
>
> Para llegar a **App Store / Play** hace falta **envolver el PWA con Capacitor** (u otro
> wrapper). Eso **aún no está montado**. La guía del camino está en
> [`.claude/capacitor-build.md`](.claude/capacitor-build.md) — y OJO: con Next.js el setup
> es distinto al de Gym (que es Vite). No copiar el flujo de Gym tal cual.

> ## 🧭 Reglas de trabajo (leer antes de commitear / desplegar)
>
> Paw es un **repo único** (no hay orquestador como Gym-Infra). Todo vive acá, en `.claude/`
> (índice en [`.claude/README.md`](.claude/README.md)):
> - **Arquitectura** (4 clientes Supabase, middleware/guard, auth, capa API, rutas) → [`.claude/architecture.md`](.claude/architecture.md).
> - **Commits / PRs** → [`.claude/commit-pr-rules.md`](.claude/commit-pr-rules.md) (firma `[NOMBRE]` obligatoria).
> - **Identidad de dev** → [`.claude/dev-identity.md`](.claude/dev-identity.md) (cuenta GitHub compartida).
> - **Estilo de copy** (español Colombia, tuteo) → [`.claude/copy-style-spanish-colombia.md`](.claude/copy-style-spanish-colombia.md).
> - **Deploy main→production** → [`.claude/deploy-main-production.md`](.claude/deploy-main-production.md).
> - **Migraciones de BD** → [`.claude/supabase-migrations.md`](.claude/supabase-migrations.md).
> - **Edge functions** → [`.claude/edge-functions.md`](.claude/edge-functions.md).
> - **PWA y push** → [`.claude/pwa-push.md`](.claude/pwa-push.md).
> - **Dominios** → [`.claude/domains.md`](.claude/domains.md).
> - **Build nativo (Capacitor, camino a tiendas)** → [`.claude/capacitor-build.md`](.claude/capacitor-build.md).

## Stack

- **Runtime**: Next.js 15 (App Router) + React 19 + TypeScript estricto
- **UI**: Tailwind v4 (tokens en `src/app/globals.css` vía `@theme inline`) + `motion` (Framer Motion v14)
- **Estado**: Zustand (`src/store/index.ts`); datos de módulos vía `src/lib/api/*`
- **Backend**: Supabase (`@supabase/ssr`) — auth, DB (Postgres + PostGIS), storage, edge functions
- **Push**: Web Push (VAPID), service worker
- **Mapas**: MapLibre + estilos CARTO
- **IA**: Anthropic SDK (`/asistente`), Groq
- **Iconos**: `lucide-react` (nunca emoji en UI)

## Entornos (Supabase)

| Entorno | Rama | Supabase project ref | Notas |
|---|---|---|---|
| **DEV** | `main` | `qomzldpywoapcusavxqw` | región ca-central-1; `PAW - Dev` |
| **PROD** | `production` | `xqjecrcpkngguokbywex` | `PAW - Prod` |

> El mapeo rama→entorno es **main=dev, production=prod** (igual que Gym). La rama `dev`
> remota es legacy/base de features — el entorno DEV se despliega desde `main`.

## Env vars (`.env.local`)

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase del entorno |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** (nunca al cliente) |
| `SUPABASE_ACCESS_TOKEN` | `sbp_...` con alcance al proyecto (migraciones/functions) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push (la privada es secret de edge functions) |
| `VAPID_PRIVATE_KEY` / `VAPID_PUBLIC_KEY` / `VAPID_SUBJECT` | Secrets de push (servidor/functions) |
| `NEXT_PUBLIC_URL` | URL pública del entorno (redirects OAuth) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google Calendar |
| `GOOGLE_CALENDAR_ENCRYPTION_KEY` | 32 bytes (`openssl rand -base64 32`) |
| `ANTHROPIC_API_KEY` / `GROQ_API_KEY` | Asistente IA |

- En local: `vercel env pull .env.local`.
- `.env*` está **gitignored** — nunca commitear valores reales.
- **Modo demo** (sin Supabase): `/demo` o `NEXT_PUBLIC_PAW_DEMO=1`. Datos en `src/lib/demo/`.

## Desarrollo

```bash
npm install
npm run dev        # http://localhost:3004
npx tsc --noEmit   # sin errores
npm run lint
npx jest
```

## Base de datos

Migraciones en `supabase/migrations/` (aplicar en orden). Detalle del flujo y estado en
[`.claude/supabase-migrations.md`](.claude/supabase-migrations.md) y `docs/setup.md`.

## UI y diseño

- Antes de crear o modificar cualquier interfaz, lee `docs/design-system.md` y síguelo.
- Usa solo los tokens de `src/app/globals.css`. **Nunca** colores hex directos ni `style={{}}` para color.
- Revisa cada cambio de UI en **modo claro y oscuro**.
- Contexto para implementar módulos: `docs/build-context.md`.
- Kit de UI en `src/components/ui`. Objetivos táctiles ≥44px. Etiqueta de texto además de color en todo estado.
