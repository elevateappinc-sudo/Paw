# Login con Google (Supabase OAuth) — Paw

Paw usa **Supabase Auth** con el provider **Google** para "Continuar con Google". El flujo es
redirect + PKCE: la app manda al usuario a Google, Google vuelve al **callback de Supabase**, y
Supabase crea la sesión. El código vive en `src/hooks/useAuth.ts` (`signInWithGoogle`) y el
callback en `src/app/auth/callback/route.ts`.

> ⚠️ **Secretos fuera del repo.** Los `client_secret*.json` de Google y cualquier llave NO se
> versionan (ver `.gitignore`). Se guardan en la bóveda local **`D:\3_ELEVATE\.credentials\paw\`**.
> Los scripts/Dashboard reciben el secret a mano o por variable, nunca desde el repo.

## Proyecto de Google Cloud

- **Proyecto:** `paw-project-511101` (Google Auth Platform). Dueño: `elevateapp.inc@gmail.com`.
- **Consent screen:** en verificación (dominio `elevateapp.co` verificado por DNS en Search
  Console bajo `elevateapp.inc@gmail.com`; cubre `paw.elevateapp.co`).

## OAuth clients (uno por ambiente)

Hay **dos** OAuth clients tipo **Web application**, en el mismo proyecto, uno por ambiente.
Cada uno apunta al callback del Supabase de su ambiente:

| Ambiente | Supabase ref | Client (nombre en Google) | Redirect URI autorizado | JS origin |
|---|---|---|---|---|
| **DEV** | `qomzldpywoapcusavxqw` | `PAW web` | `https://qomzldpywoapcusavxqw.supabase.co/auth/v1/callback` | — |
| **PROD** | `xqjecrcpkngguokbywex` | `PAW web PROD` | `https://xqjecrcpkngguokbywex.supabase.co/auth/v1/callback` | `https://paw.elevateapp.co` |

- **Client ID PROD** (público): `585931848937-sb5p004m42t6cj9lmcmr1el6s0ce8fu0.apps.googleusercontent.com`
- **Client Secret PROD:** en la bóveda `D:\3_ELEVATE\.credentials\paw\google-oauth-paw-prod.json` (NO en el repo).

> El `client_secret` es sensible: si se filtra, **rotarlo** en Google Cloud Console → Credentials
> → ese client → "Reset secret", y volver a setearlo en Supabase.

## Activar/actualizar el provider en Supabase

El provider Google se configura en **cada** proyecto Supabase por separado:

- **Por Dashboard:** Supabase → el proyecto (DEV o PROD) → **Authentication → Providers → Google**
  → activar + pegar **Client ID** y **Client Secret** del client de ESE ambiente → Save.
- El **callback** que Supabase espera que esté en el client de Google es
  `https://<ref>.supabase.co/auth/v1/callback` (ya configurado en cada client, ver tabla).

Estado (2026-11-11): **DEV = activo** (probado, el botón lleva a Google). **PROD = pendiente de
activar** con el client `PAW web PROD` (credenciales ya en la bóveda).

## App nativa (Capacitor) — nota

Con el flujo de Supabase, la app nativa **reusa estos mismos clients Web**: el login abre el
navegador del sistema y vuelve a la app por **deep link** (Universal Links iOS / App Links
Android). NO hace falta crear clients tipo Android/iOS en Google para este flujo. Lo pendiente
para nativo es configurar los deep links, no otro client. Ver `.claude/capacitor-build.md`.

## Verificar que funciona

1. Abrir `https://paw.elevateapp.co/login` (PROD) o `https://paw-dev.elevateapp.co/login` (DEV).
2. Pulsar "Continuar con Google" → debe redirigir a `accounts.google.com` con el `client_id`
   del ambiente y `redirect_uri=https://<ref>.supabase.co/auth/v1/callback`.
3. Tras autorizar, vuelve a la app con sesión iniciada.
