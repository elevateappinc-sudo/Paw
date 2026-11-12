# `.claude/` — Reglas e instrucciones de Paw

Índice de las instrucciones que una sesión de Claude Code debe seguir en este repo.
El punto de entrada es [`../CLAUDE.md`](../CLAUDE.md).

| Archivo | Para qué |
|---|---|
| [`commit-pr-rules.md`](./commit-pr-rules.md) | Firma `[NOMBRE]` en commits/PRs, flujo de ramas, **sin atribución a IA** |
| [`dev-identity.md`](./dev-identity.md) | Cuenta GitHub compartida + cómo se atribuye cada dev |
| [`copy-style-spanish-colombia.md`](./copy-style-spanish-colombia.md) | Español de Colombia (tuteo), no voseo |
| [`architecture.md`](./architecture.md) | Cómo está cableada: 4 clientes Supabase, middleware/guard, auth, capa API, rutas |
| [`pwa-push.md`](./pwa-push.md) | PWA instalable + service worker + Web Push (VAPID) |
| [`deploy-main-production.md`](./deploy-main-production.md) | Deploy **main=DEV → production=PROD** (Vercel + Supabase) |
| [`supabase-migrations.md`](./supabase-migrations.md) | Migraciones de BD (en repo), aplicar DEV→PROD |
| [`edge-functions.md`](./edge-functions.md) | Edge functions (Deno), deploy por entorno, secrets |
| [`domains.md`](./domains.md) | Dominios por entorno (single-tenant), Vercel + Cloudflare |
| [`capacitor-build.md`](./capacitor-build.md) | **Camino a App Store/Play**: envolver el PWA con Capacitor (Next.js, no montado) |

## Lo mínimo que debes saber

- **Paw es single-tenant** (una marca, un dominio por entorno). **No** es multi-tenant como Gym.
- **Paw es un PWA de Next.js 15** (no Capacitor hoy). Se despliega en Vercel.
- **Entornos:** `main`=DEV (Supabase `qomzldpywoapcusavxqw`), `production`=PROD (`xqjecrcpkngguokbywex`).
- **Nunca** push directo a `main`/`production`: todo por PR, firmado `[NOMBRE]`, sin atribución a IA.
- **DEV antes que PROD**, siempre (código, migraciones y functions).
