# Plan de Capacitor + OTA para Paw (apps Android/iOS)

> **Audiencia:** el dev/lead que implementará el empaquetado nativo de Paw. Es un plan de
> ejecución, no un tutorial genérico. Léelo completo antes de tocar nada.
>
> **Estado:** PROPUESTO (nada montado aún). Decisiones ya tomadas con el lead: bundle id
> `com.elevate.paw`; arrancar por **Android** (iOS queda preparado, compila en Mac).
>
> Complementa `/.claude/capacitor-build.md` (la guía de referencia). Este documento es el
> plan concreto con arquitectura, ambientes, flujos de despliegue, generación de apps y OTA.

---

## 0. TL;DR del plan

1. Paw se empaqueta con Capacitor en modo **WebView `server.url`**: la app nativa es un shell
   que carga el PWA en vivo (`paw.elevateapp.co` en PROD, `paw-dev.elevateapp.co` en pruebas).
2. **Apuntamiento dev/prod = qué dominio carga el binario.** El backend (Supabase) NO va en la
   app; va en el deployment de Vercel que la app carga. Eso ya está configurado por ambiente.
3. **OTA: Paw ya tiene OTA "por defecto".** Con `server.url`, cada deploy a Vercel se refleja al
   instante en la app, sin republicar en tiendas y sin el stack de Capgo que usa Gym. Se explica
   a fondo en la §7, con el porqué y cuándo sí haría falta el patrón de Gym.
4. Para tiendas falta código **nativo**: push FCM, Apple Sign-In (obligatorio iOS), deep links
   (OAuth), íconos/splash y firma.
5. Orden de trabajo: **Android primero** (todo desde Windows) → luego iOS (requiere Mac).

---

## 1. Arquitectura y estrategia

### 1.1 Por qué `server.url` (WebView) y no bundle estático

Paw es **Next.js 15 App Router** con server components, rutas API (`/auth/callback/route.ts`,
`/api/assistant`, push), `middleware` y `redirects` en `next.config.ts` (`/` → `/home`). Eso
**no** se exporta a estático con `output: 'export'` sin reescribir media app. Por eso el camino
viable es **A — WebView wrapper (`server.url`)**: Capacitor abre un `WKWebView`/`WebView` que
carga el dominio de Vercel en vivo. La app nativa aporta el contenedor, los plugins nativos
(push, deep links, splash) y la ficha de tienda; el contenido corre en Vercel como hoy.

| | Gym-Users | **Paw** |
|---|---|---|
| Front | Vite + **export estático** | Next.js 15 (server components + API) |
| Qué viaja en el binario | **el bundle web completo** (`dist/`) | **solo un shell**; el contenido se carga de `server.url` |
| Cómo se actualiza el contenido | OTA Capgo (swap del `dist/` local) | **deploy a Vercel** (la WebView recarga el sitio en vivo) |
| Backend (Supabase) | `VITE_*` **horneadas en el bundle** | en el **deployment de Vercel**, no en la app |

> Consecuencia central (se retoma en §7): como el contenido NO vive en el binario, **no hay
> bundle local que “actualizar” con Capgo**. El OTA de Gym resuelve un problema que Paw no
> tiene. El “update sin republicar” lo da Vercel directamente.

### 1.2 Diagrama de capas (runtime)

```
┌─────────────────────────────┐     carga server.url (HTTPS)    ┌──────────────────────────┐
│   App nativa (Capacitor)    │ ───────────────────────────────▶│  Vercel (deployment del  │
│  com.elevate.paw            │                                  │  ambiente) = PWA Next.js │
│  - WebView → server.url     │◀─────────── HTML/JS/CSS ─────────│                          │
│  - Plugins nativos:         │                                  │  env por ambiente:       │
│    · Push (FCM/APNs)        │                                  │  NEXT_PUBLIC_SUPABASE_*  │
│    · Deep links (OAuth)     │                                  │  SUPABASE_SERVICE_ROLE_* │
│    · Splash / App           │                                  │  NEXT_PUBLIC_URL …       │
└─────────────┬───────────────┘                                  └────────────┬─────────────┘
              │ token de device (FCM)                                          │ server → Supabase
              ▼                                                                ▼
   Supabase del ambiente (push)                                   Supabase del ambiente (DB/Auth/Edge)
   PROD xqjec… / DEV qomzld…                                      PROD xqjec… / DEV qomzld…
```

La app nativa toca Supabase **directamente** solo para registrar el **token de push** (plugin
nativo). Todo lo demás (auth, datos, OAuth, asistente) pasa por el WebView → Vercel → Supabase,
exactamente como la web hoy.

---

## 2. Ambientes y apuntamiento al backend (dev / prod)

**Regla de oro:** en `server.url` el apuntamiento a dev/prod **no se hace con env de Supabase en
la app** — se hace eligiendo **qué dominio carga el binario**. Ese dominio ya está atado a su
Supabase en Vercel (trabajo ya hecho esta sesión).

| Ambiente | `server.url` del binario | Vercel (deployment) | Supabase | Uso |
|---|---|---|---|---|
| **PROD** (tiendas) | `https://paw.elevateapp.co` | `production` | `xqjecrcpkngguokbywex` | el `.aab`/`.ipa` que se publica |
| **DEV/QA** (interno) | `https://paw-dev.elevateapp.co` | `main` (preview) | `qomzldpywoapcusavxqw` | builds de prueba en device |
| **Local** (opcional) | `http://<ip-LAN>:3004` | `next dev` local | DEV | depurar contra la máquina (requiere `cleartext:true` solo en ese build) |

- **El binario de tienda SIEMPRE apunta a PROD.** Un binario de QA apunta a DEV; nunca se publica
  un binario con `server.url` de DEV.
- Como el Supabase lo resuelve el deployment de Vercel, **el mismo binario “cambia de backend”
  solo cambiando el dominio** — no hay que recompilar por cambios de env de Supabase.
- El login con Google ya quedó separado por ambiente (clients `PAW web` DEV / `PAW web PROD`
  PROD, cada uno con su callback de Supabase). La app nativa hereda eso vía el dominio que carga.

---

## 3. Variables de entorno (qué vive dónde)

Con `server.url` la app nativa tiene **muy poca** configuración propia. La mayoría del env sigue
en Vercel (ya configurado). Esta tabla es la fuente de verdad:

### 3.1 En la app nativa (Capacitor) — se hornea en `cap sync`
| Variable (build-time, Node) | Para qué | Valor |
|---|---|---|
| `PAW_NATIVE_SERVER_URL` | el dominio que carga la WebView | PROD: `https://paw.elevateapp.co` · QA: `https://paw-dev.elevateapp.co` |
| `appId` (en `capacitor.config.ts`) | bundle id (permanente) | `com.elevate.paw` |
| `appName` | nombre interno | `Paw` |

> `capacitor.config.ts` corre en **Node** (CLI de Capacitor), fuera de Next. Para leer
> `PAW_NATIVE_SERVER_URL` de un `.env` hay que cargarlo con `dotenv` dentro del config (igual que
> Gym hace para su `VITE_OTA_UPDATE_URL`). Ver §5.2.

### 3.2 En Vercel (por ambiente) — YA configurado, no cambia por Capacitor
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`NEXT_PUBLIC_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, y las de Google Calendar/Anthropic cuando
apliquen. Production→PROD, Preview/Development→DEV. **La app nativa no las toca.**

### 3.3 En Supabase (secrets de edge functions) — por proyecto
VAPID, y las que ya existen. **Se añade** la config de push nativo (ver §6): la service account
de FCM. No van en el repo ni en la app.

### 3.4 En los stores de publicación (NO en el repo)
Keystore Android (+ contraseñas), certificados/provisioning iOS (bóveda Elevate
`D:\3_ELEVATE\.credentials\ios\paw\`), `google-services.json` / `GoogleService-Info.plist` de
Firebase. Todo gitignored (ya se reforzó `.gitignore` para `*client_secret*.json`,
`google-services.json`, `GoogleService-Info.plist`, `*.keystore`, `*.p12`).

---

## 4. Flujos de despliegue (cómo un cambio llega al usuario)

Este es el corazón del plan. Hay **dos tipos de cambio** con caminos distintos:

### 4.1 Cambio WEB (JS/TS/CSS/contenido/lógica de páginas) → sin tocar tiendas
```
git push → PR → merge a main (DEV) → merge a production (PROD)
   → Vercel despliega → la WebView de la app carga el sitio nuevo en el próximo arranque
```
- **Esto es el “OTA” de Paw: automático, instantáneo, sin build nativo, sin tiendas.**
- Sirve para la gran mayoría de cambios (features de UI, textos, fixes, flujos, etc.).
- Caveat de caché (importante): el service worker del PWA (`public/sw.js`) y el cache de imágenes
  pueden fijar contenido viejo. Next.js ya hashea assets, pero hay que garantizar que el **app
  shell** se sirva *network-first* (o con cache-busting) para que el cambio se vea sin desinstalar.
  Acción: revisar la estrategia del SW antes de publicar (ver §8, checklist).

### 4.2 Cambio NATIVO (plugin nuevo, permisos, `versionCode`, bundle id, splash) → republicar
```
cambio en android/ o ios/ o en capacitor.config → npx cap sync → build firmado
   → subir AAB a Play / IPA a App Store → revisión de la tienda
```
- Requiere subir **versión nueva** a la tienda y esperar revisión (horas–días).
- Es **poco frecuente**: solo cuando cambia el contenedor nativo, no el contenido web.

### 4.3 Matriz de decisión
| Cambio | ¿Build nativo? | ¿Republicar en tienda? | Cómo llega |
|---|---|---|---|
| UI, textos, páginas, lógica web, fix JS | ❌ | ❌ | deploy a Vercel (instantáneo) |
| Nuevo plugin Capacitor / permiso | ✅ | ✅ | tienda |
| Cambiar `server.url` de ambiente | ✅ (rebuild) | solo si es el de tienda | tienda |
| Ícono / splash / nombre | ✅ | ✅ | tienda |
| Config de push / deep links nativos | ✅ | ✅ | tienda |

---

## 5. Generación de las apps (build) — paso a paso

### 5.1 Instalar Capacitor
```bash
cd D:\3_ELEVATE\5_Paw
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/app @capacitor/splash-screen   # plugins base
npx cap init "Paw" "com.elevate.paw" --web-dir=public
```
`--web-dir=public` porque en `server.url` no se empaqueta el sitio: Capacitor solo exige una
carpeta con un `index.html` mínimo de fallback (si la red falla al primer arranque). Se puede
crear un `public/capacitor-fallback.html` simple; `webDir` apunta a `public`.

### 5.2 `capacitor.config.ts` (modo server.url, env-driven)
```ts
import type { CapacitorConfig } from '@capacitor/cli';
import { config as loadEnv } from 'dotenv';

// capacitor.config corre en Node, fuera de Next: cargar el .env manualmente.
loadEnv({ path: process.env.CAP_ENV_FILE || '.env.capacitor.local' });

const SERVER_URL = process.env.PAW_NATIVE_SERVER_URL || 'https://paw.elevateapp.co'; // default PROD

const config: CapacitorConfig = {
  appId: 'com.elevate.paw',
  appName: 'Paw',
  webDir: 'public',
  server: {
    url: SERVER_URL,
    cleartext: SERVER_URL.startsWith('http://'), // solo para builds locales de prueba
    allowNavigation: ['paw.elevateapp.co', 'paw-dev.elevateapp.co'],
  },
  plugins: {
    SplashScreen: { launchShowDuration: 800, backgroundColor: '#0b1220' },
  },
};

export default config;
```
- `.env.capacitor.local` (gitignored) define `PAW_NATIVE_SERVER_URL` por máquina/flavor.
- Para un build de **QA** (device interno): `PAW_NATIVE_SERVER_URL=https://paw-dev.elevateapp.co`.
- Para **tienda**: sin override (usa el default PROD) o `=https://paw.elevateapp.co`.

### 5.3 Añadir plataformas
```bash
npx cap add android
npx cap add ios      # crea ios/ aunque se compile en Mac; que la estructura quede completa
npx cap sync
```
`.gitignore`: versionar `android/` e `ios/` **sin** artefactos de build (`android/.gradle/`,
`android/app/build/`, `ios/App/Pods/`, `DerivedData/`) ni secretos (`google-services.json`,
`GoogleService-Info.plist`, keystore, `.p12`).

> **Antes de cualquier build Android:** correr `npx cap sync android`. Algunos archivos
> (`capacitor-cordova-android-plugins/cordova.variables.gradle`, `app/src/main/assets/...`) son
> **generados por sync** y están gitignored; sin el sync, Gradle falla con *"Could not read
> script cordova.variables.gradle"*. Regla: clonar → `npm install` → `npx cap sync android` → build.

### 5.4 Build Android (desde Windows) — AAB firmado
1. Crear keystore (una sola vez, guardar FUERA del repo en la bóveda):
   ```bash
   keytool -genkey -v -keystore paw-release.keystore -alias paw -keyalg RSA -keysize 2048 -validity 10000
   ```
   Guardar `paw-release.keystore` + contraseñas en `D:\3_ELEVATE\.credentials\paw\android\`.
   **Permanente**: sin ese keystore no se puede actualizar la app en Play nunca más.
2. Configurar `signingConfigs` en `android/app/build.gradle` leyendo el keystore por propiedades
   (no hardcodear; usar `~/.gradle/gradle.properties` o variables).
3. `applicationId = "com.elevate.paw"`, subir `versionCode`/`versionName` en cada release.
4. Build: `cd android && ./gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab`.
5. Probar el `.aab` en un device (bundletool o subiéndolo a un track interno de Play).

### 5.5 Build iOS (requiere Mac con Xcode) — IPA firmado
1. En la Mac: `npx cap open ios` (abre Xcode).
2. Firma: team Elevate `VCKJSHHNDM`, cert/provisioning de la bóveda
   `D:\3_ELEVATE\.credentials\ios\paw\` (al estilo de otras marcas; OpenSSL3 puede pedir `-legacy`
   para el `.p12`).
3. Bundle id `com.elevate.paw` registrado en Apple Developer.
4. Archive → Distribute → export `.ipa` → subir a App Store Connect.

### 5.6 Íconos y splash
```bash
npm install -D @capacitor/assets
# icon.png 1024×1024 y splash.png (2732×2732) en el root o /assets
npx cap assets generate
```
Hoy Paw tiene íconos PWA (192/512) pero **falta** el `icon.png` 1024×1024 y el splash nativos.

---

## 6. Push notifications nativas (FCM) — replicando el patrón de Gym

Hoy Paw usa **Web Push (VAPID)**, que **no** cubre la app nativa. Para nativo se usa **FCM**
(Android) y **APNs vía FCM** (iOS), igual que Gym. El patrón de Gym es directamente reutilizable:

### 6.1 Lo que hay que montar
1. **Proyecto Firebase para Paw** (nuevo, separado del de Gym) → genera `google-services.json`
   (Android) y `GoogleService-Info.plist` (iOS). NO se commitean.
2. **Plugin cliente:** preferir `@capacitor-firebase/messaging` (el que usa Gym-Users) sobre el
   genérico, para iOS/Android/Web unificado. Registrar el token del device y guardarlo en una
   tabla `push_subscriptions`/`user_device_tokens` de Paw con `platform: ios|android|web`.
3. **Backend de envío (edge function en el Supabase de Paw):** replica la edge `push` de Gym
   (`fcm.googleapis.com/v1/projects/<id>/messages:send`, OAuth con service account, scope
   `firebase.messaging`). Secrets `FCM_PROJECT_ID` + `FCM_SERVICE_ACCOUNT_JSON` en Supabase.
   Paw ya tiene `notification-processor`; se extiende para enviar a **tokens nativos** además de
   Web Push (bloques `android` y `apns` en el payload, como Gym).
4. **iOS:** APNs Authentication Key (`.p8`) de Apple Developer subida a Firebase; `AppDelegate`
   registra APNs para FCM; capability Push Notifications en Xcode.

### 6.2 Qué se reutiliza de Gym (referencia, no copiar a ciegas)
- Cadena: `admin dispara → tabla notifications → DB webhook → edge push → FCM`.
- Limpieza de tokens inválidos (UNREGISTERED/NOT_FOUND) borrándolos de la tabla.
- El Web Push actual sigue sirviendo para la versión web/PWA; FCM es el canal nativo.

---

## 7. OTA — análisis a fondo (la parte que el lead pidió replicar de Gym)

> **Conclusión primero:** con la arquitectura `server.url`, **Paw ya cumple el objetivo de OTA**
> (“descargar cambios pequeños sin republicar la app”) de forma nativa y **más simple que Gym**.
> El stack de OTA de Gym (Capgo + tabla + bucket + edge + publisher) **no aplica** a `server.url`
> y **no debe montarse** mientras Paw use este enfoque. Abajo el porqué, en detalle.

### 7.1 Qué resuelve el OTA de Gym y por qué existe
Gym-Users es Vite + **export estático**: el bundle web (`dist/`) **viaja dentro del binario**.
Sin OTA, cambiar una coma de JS exigiría republicar en tiendas. Por eso Gym montó **Capgo
self-hosted**: un sistema para **descargar un `dist/` nuevo y hacer swap del bundle local** en
caliente. Piezas (todas necesarias por el modelo “bundle en el binario”):
- Plugin `@capgo/capacitor-updater` (`capacitor.config.ts`: `updateUrl`, `autoUpdate:false`,
  `defaultChannel`).
- Tabla `ota_releases` (`app`, `channel`, `version`, `url`, `checksum`, `min_native`, `is_active`)
  con RLS SELECT público y escritura solo `service_role`.
- Bucket público `ota-bundles` (`<app>/<channel>/<version>.zip`).
- Edge `ota-check` (recibe `{version,channel,app}`, compara semver, responde `{update,url,...}`).
- Publisher `scripts/ota/publish-bundle.mjs` (zip con `@capgo/cli` → SHA256 → upload → upsert).
- Cliente `useLiveUpdate` (`notifyAppReady` + fetch a `ota-check` + `download` + `set` al volver a
  foreground). Canales `beta`/`production`; feeds por `app` (multi-marca); anti-rollback por
  `notifyAppReady()`.

### 7.2 Por qué eso NO aplica a Paw (`server.url`)
En `server.url` **no hay `dist/` local que actualizar**: la WebView carga el sitio desde Vercel
en cada arranque. Montar Capgo en Paw sería:
- **Redundante:** Capgo descargaría un bundle que la app no usa (el contenido viene del servidor).
- **Contradictorio:** tendrías dos fuentes de verdad del contenido (el bundle OTA y el sitio de
  `server.url`). No hay forma coherente de que Capgo “reemplace” lo que sirve Vercel.
- **Trabajo muerto:** tabla + bucket + edge + publisher + gestión de versiones/canales/`min_native`
  para resolver un problema inexistente.

### 7.3 El OTA real de Paw (lo que SÍ se usa)
```
Deploy a Vercel (production)  ──►  la WebView recarga el sitio en el próximo arranque  ──►  usuario con el cambio
```
- **Instantáneo y para el 100% de los usuarios** (no por device, no por semver, no staged).
- **Cero infra extra.** El “canal” es el ambiente (DEV = `paw-dev`, PROD = `paw`).
- Supera el objetivo del lead: no solo “cambios pequeños”, sino **cualquier cambio web** sin
  tienda, sin paso de descarga, sin gestión de versiones de bundle.
- **Lo único que NO cubre** (igual que Capgo): cambios **nativos** → esos sí van por tienda.

### 7.4 Lo que hay que cuidar para que el “OTA por defecto” funcione bien
1. **Caché del service worker:** garantizar que el app shell no quede pinneado (network-first o
   versionado del SW). Si no, un deploy nuevo podría no verse hasta limpiar caché.
2. **Compatibilidad web↔nativo:** si un cambio web empieza a **depender de un plugin nativo** que
   el binario publicado no tiene, rompe. Misma disciplina que Gym: todo lo que toque nativo va por
   tienda, y el código web debe degradar si el plugin no está (feature-detect de Capacitor).
3. **Rollback:** se hace revirtiendo el deploy en Vercel (o `vercel rollback`), no con `is_active`.

### 7.5 ¿Cuándo SÍ convendría el patrón Capgo de Gym?
Solo si Paw migra al **camino B (bundle estático offline)**: reescribir las rutas server como edge
functions, volver la app un SPA cliente y empaquetar el `dist/` en el binario. Ahí recién el
contenido viviría en la app y Capgo tendría sentido (y daría **offline**, que `server.url` no da).
Es un **proyecto aparte**, grande, que hoy no se justifica. Si se decide, este plan se amplía con
la réplica exacta del stack de §7.1 sobre el Supabase de Paw. **Recomendación: no hacerlo ahora.**

### 7.6 Resumen OTA
| | `server.url` (Paw hoy) | Capgo bundled (Gym) |
|---|---|---|
| Actualizar contenido sin tienda | ✅ deploy Vercel (instantáneo, global) | ✅ publicar bundle (por semver/canal) |
| Infra extra | ninguna | tabla + bucket + edge + publisher + cliente |
| Offline | ❌ (requiere red) | ✅ |
| Staged rollout (beta/prod) por device | ❌ (es global por ambiente) | ✅ |
| Complejidad | baja | alta |
| **Recomendado para Paw** | ✅ **sí** | ❌ solo si se va a camino B |

---

## 8. Deep links y Apple Sign-In (requisitos de tienda)

### 8.1 Deep links / Universal Links (OAuth)
Con `server.url` el OAuth de Google (redirect + PKCE, ya implementado) debe **volver a la app** y
no abrir el navegador externo:
- **iOS:** Associated Domains (`applinks:paw.elevateapp.co`) + archivo
  `.well-known/apple-app-site-association` servido por el dominio.
- **Android:** App Links (`autoVerify`) + `.well-known/assetlinks.json` en el dominio.
- Mantener el flujo redirect+PKCE actual (compatible con WebView). Ver `docs/ios-pwa-oauth-spike.md`.

### 8.2 Apple Sign-In (OBLIGATORIO en iOS)
Apple (App Store Guideline 4.8) **exige** ofrecer “Iniciar sesión con Apple” si la app ofrece
login social de terceros (Paw ofrece Google). Sin esto, **Apple rechaza la app**.
- Activar el provider **Apple** en el Supabase de Paw (mismo patrón que se usó para Google).
- Requiere cuenta Apple Developer (US$99/año, necesaria igual para publicar) + Service ID + key.
- Solo aplica a iOS; Android/web no lo exigen. Añadir el botón “Continuar con Apple” en `/login`
  (puede mostrarse solo en iOS).

---

## 9. Fases de ejecución (orden recomendado)

### Fase 0 — Preparación (Windows) ✅ listo para arrancar
- [ ] `public/capacitor-fallback.html` mínimo (fallback sin red).
- [ ] `icon.png` 1024×1024 + `splash.png` (pedir al diseño o derivar del `icon.svg` actual).
- [ ] Confirmar estrategia de caché del SW (network-first para el shell).

### Fase 1 — Montar Capacitor + Android (Windows)
- [ ] Instalar Capacitor + plugins base; `cap init` con `com.elevate.paw`.
- [ ] `capacitor.config.ts` env-driven (§5.2) + `.env.capacitor.local` (gitignored).
- [ ] `cap add android ios` + `cap sync`; ajustar `.gitignore` de artefactos nativos.
- [ ] Crear keystore (bóveda), `signingConfigs`, `versionCode/Name`.
- [ ] Build AAB (`server.url` = PROD) y también un APK de QA (`server.url` = `paw-dev`) para device.
- [ ] Probar en device Android: carga el sitio, navegación, login Google vuelve a la app (deep links).

### Fase 2 — Push FCM (Android primero)
- [ ] Proyecto Firebase de Paw; `google-services.json` (fuera del repo, en `android/app/`).
- [ ] Plugin `@capacitor-firebase/messaging`; guardar token en tabla de Paw.
- [ ] Edge de envío FCM en Supabase de Paw (réplica de la de Gym) + secrets.
- [ ] Probar push real en device Android.

### Fase 3 — Deep links Android (App Links)
- [ ] `assetlinks.json` en el dominio; `autoVerify` en el manifest. Validar retorno de OAuth.

### Fase 4 — Publicar Android (Play)
- [ ] Ficha, capturas, política de privacidad; subir AAB a track interno → cerrado → producción.

### Fase 5 — iOS (requiere Mac + Apple Developer)
- [ ] Cuenta Apple Developer; bundle id `com.elevate.paw`.
- [ ] Apple Sign-In (provider en Supabase + botón en `/login`).
- [ ] APNs key en Firebase; push en iOS; Universal Links (`apple-app-site-association`).
- [ ] Build IPA firmado (bóveda Elevate); subir a App Store Connect; revisión.
- [ ] Mitigar Apple 4.2 (minimum functionality): push nativo real, splash/ícono propios,
      experiencia de app (sin barra de navegador).

### Fase 6 — Operación continua
- [ ] Documentar el flujo: “cambio web → deploy Vercel” vs “cambio nativo → rebuild + tienda”.
- [ ] (Opcional futuro) evaluar camino B + Capgo solo si se requiere offline.

---

## 10. Seguridad y reglas (no romper)
- **Bundle id `com.elevate.paw` es permanente.** No cambiarlo tras publicar.
- **Nunca commitear** keystore, `.p12`, provisioning, `google-services.json`,
  `GoogleService-Info.plist`, ni secretos de FCM. Van a la bóveda `D:\3_ELEVATE\.credentials\paw\`
  (ya reforzado en `.gitignore`).
- Los tokens (Vercel, Cloudflare, Supabase, FCM service account) se pasan por env/secret, nunca
  en el repo ni en el binario.
- Commits/PRs: firma `[NOMBRE]`, autor `elevateappinc-sudo`, sin atribución a IA; nunca push
  directo a `main`/`production` (siempre PR).

---

## 11. Resumen de decisiones tomadas
- **Enfoque:** WebView `server.url` (no bundle estático).
- **Bundle id:** `com.elevate.paw`.
- **Apuntamiento backend:** por dominio del binario (PROD=`paw.elevateapp.co`, QA=`paw-dev…`).
- **OTA:** el de Vercel (deploy = update instantáneo). NO se monta Capgo mientras sea `server.url`.
- **Orden:** Android primero (Windows) → iOS después (Mac).
- **Pendiente obligatorio iOS:** Apple Sign-In (guideline 4.8).
