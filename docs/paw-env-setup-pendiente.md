# Paw — Configurar variables/secrets pendientes (DEV y PROD)

> **Para la sesión de Claude Code que reciba este archivo.** Es una tarea de configuración de
> entorno. No es código: no toca `src/`. Sigue los pasos, pídele al dev los valores secretos que
> faltan, y aplícalos en su lugar correcto por ambiente. **No** subas ningún secreto al repo.

## Contexto (lo que YA está hecho — no rehacer)

Paw es **single-tenant**, Next.js 15 PWA en Vercel. Dos ambientes ya separados y verificados:

| Ambiente | Rama | Dominio | Vercel scope | Supabase project ref |
|---|---|---|---|---|
| **DEV** | `main` | `paw-dev.elevateapp.co` | Preview + Development | `qomzldpywoapcusavxqw` (PAW - Dev) |
| **PROD** | `production` | `paw.elevateapp.co` | Production | `xqjecrcpkngguokbywex` (PAW - Prod) |

Ya configurado y funcionando: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_URL` (los 3 scopes de Vercel, cada uno a su BD), y
**VAPID** (push) en las edge functions de ambos proyectos + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` en
Vercel **Production**.

## Lo que FALTA (esta tarea)

### Regla crítica de coincidencia
Las variables de **Google Calendar** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_CALENDAR_ENCRYPTION_KEY`) las leen **tanto rutas de Next (Vercel) como edge functions
(Supabase secrets)**. Para un mismo ambiente, **el valor debe ser idéntico en Vercel y en
Supabase**; si no, lo que cifra Next no lo descifra la edge function (y viceversa).

Referencias en código:
- Next (Vercel): `src/app/auth/google-calendar/route.ts`, `.../callback/route.ts`, `src/lib/google-calendar.ts`, `src/app/api/assistant/route.ts`
- Edge (Supabase secrets): `supabase/functions/{sync-to-gcal,sync-from-gcal,renew-gcal-webhooks,notification-processor}/index.ts`

### 1. Asistente IA — solo Vercel
| Variable | DEV (Preview+Development) | PROD (Production) | Fuente |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | key de dev | key de prod | console.anthropic.com → API Keys (crear 2) |

### 2. Google Calendar — Vercel **y** Supabase secrets (valores que coincidan)
| Variable | Dónde | DEV | PROD | Fuente |
|---|---|---|---|---|
| `GOOGLE_CLIENT_ID` | Vercel + Supabase secrets | cliente dev | cliente prod | Google Cloud Console → Credenciales → OAuth client (Web) |
| `GOOGLE_CLIENT_SECRET` | Vercel + Supabase secrets | ↑ mismo | ↑ mismo | mismo cliente OAuth |
| `GOOGLE_CALENDAR_ENCRYPTION_KEY` | Vercel + Supabase secrets | `openssl rand -base64 32` | otra distinta | generar 1 por ambiente |
| `NEXT_PUBLIC_URL` | **Supabase secrets** (en Vercel ya está) | `https://paw-dev.elevateapp.co` | `https://paw.elevateapp.co` | — |

Config del OAuth client en Google Cloud Console:
- Habilitar **Google Calendar API**.
- **Redirect URIs autorizados**:
  - DEV: `https://paw-dev.elevateapp.co/auth/google-calendar/callback`
  - PROD: `https://paw.elevateapp.co/auth/google-calendar/callback`
- Crear **2 clientes** (uno por ambiente).

### 3. Login con Google (si se quiere) — Supabase Dashboard, NO es env var
- Supabase → **Authentication → Providers → Google** → activar + client id/secret, en **PAW-Dev** y **PAW-Prod** por separado.
- Requiere **publicar la OAuth consent screen** en Google Cloud.
- Puede reusar el mismo cliente OAuth del Calendar o uno aparte.

### 4. Push en DEV (asimetría menor) — solo Vercel DEV
| Variable | Dónde | Valor |
|---|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Vercel Preview + Development | = la `VAPID_PUBLIC_KEY` que ya tienen las edge functions de **PAW-Dev** (sácala con quien tenga acceso, o regenera el par para DEV) |

### Omitir
- `GROQ_API_KEY`: está en la doc pero **ningún archivo la usa**. No configurar salvo que se confirme uso.

## Cómo pedir los valores
Antes de aplicar, pídele al dev (humano) los valores secretos que no se pueden generar:
`ANTHROPIC_API_KEY` (x2), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` (x2). La
`GOOGLE_CALENDAR_ENCRYPTION_KEY` genérala tú con `openssl rand -base64 32` (una por ambiente) y
usa **el mismo valor** en Vercel y en Supabase para ese ambiente.

## Comandos

```bash
# Requisitos: estar logueado en ambos CLIs (vercel whoami / supabase projects list)
cd <ruta-a-Paw>
vercel link --project paw --yes   # si el repo no está linkeado

# --- Vercel (por scope). Pipe el valor por stdin para no exponerlo en el historial ---
printf '%s' "VALOR" | vercel env add ANTHROPIC_API_KEY production
printf '%s' "VALOR" | vercel env add ANTHROPIC_API_KEY preview
printf '%s' "VALOR" | vercel env add ANTHROPIC_API_KEY development
# idem GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_CALENDAR_ENCRYPTION_KEY
# idem NEXT_PUBLIC_VAPID_PUBLIC_KEY en preview + development

# --- Supabase secrets (por proyecto). Usa --env-file para no exponer en ps ---
# PROD = xqjecrcpkngguokbywex   |   DEV = qomzldpywoapcusavxqw
printf 'GOOGLE_CLIENT_ID=...\nGOOGLE_CLIENT_SECRET=...\nGOOGLE_CALENDAR_ENCRYPTION_KEY=...\nNEXT_PUBLIC_URL=https://paw.elevateapp.co\n' > /tmp/paw.prod.env
supabase secrets set --env-file /tmp/paw.prod.env --project-ref xqjecrcpkngguokbywex
rm -f /tmp/paw.prod.env
# (repite para DEV con los valores de dev y NEXT_PUBLIC_URL=https://paw-dev.elevateapp.co)

# --- Redeploy del ambiente de Vercel cuyos env cambiaron ---
vercel redeploy "$(vercel ls paw --prod | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | head -1)"
# (DEV/Preview toma los cambios en el próximo deploy de main)
```

> Los secrets de Supabase aplican sin redeploy; las env de Vercel exigen redesplegar ese ambiente.

## Validación
- **DB por ambiente** (debe seguir OK): el bundle de `paw.elevateapp.co` referencia
  `xqjecrcpkngguokbywex`; el de `paw-dev.elevateapp.co`, `qomzldpywoapcusavxqw`.
- **Encryption key coincide** Vercel↔Supabase por ambiente (probar conectar y desconectar
  Google Calendar sin error de descifrado).
- **Asistente IA** responde en ambos.

## Reglas del repo (importantes)
- **Nunca** commitear secretos. `.env*` está gitignored; no subir valores reales.
- **Sin atribución a IA** en commits/PR (ni `Co-Authored-By: Claude`, ni 🤖).
- Si se commitea algo (p. ej. actualizar esta doc), **firmar el título con `[NOMBRE]`** del dev y
  abrir **PR** (nunca push directo a `main`/`production`).
