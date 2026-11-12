# Push nativo (FCM) — setup pendiente de consola (Paw)

> El **código** de push nativo ya está (hook `useNativePush`, migración `fcm_token`,
> `notification-processor` extendido para FCM). Falta lo que **solo se hace en consola**:
> crear el proyecto Firebase de Paw, bajar `google-services.json`, la service account, y
> cargar los secrets en Supabase. Esta guía es ese cierre.

## Arquitectura (resumen)
```
App nativa → @capacitor-firebase/messaging → token FCM
   → push_subscriptions (platform=android|ios, fcm_token)   [useNativePush]
Backend: notification-processor
   · suscripción con fcm_token → FCM (fcm.googleapis.com/v1)   [sendFcm]
   · suscripción con endpoint  → Web Push/VAPID (como hoy)     [sendWebPush]
```
Web Push (PWA) sigue funcionando igual; FCM es el canal adicional para la app nativa.

## 1. Proyecto Firebase de Paw (consola) — lo haces tú
1. https://console.firebase.google.com → **Add project** → "Paw" (o reutilizar el proyecto
   Google `paw-project-511101` si se quiere todo junto; recomendado un proyecto Firebase propio).
2. **Add app → Android**:
   - **Android package name:** `com.elevate.paw` (debe coincidir con el applicationId).
   - (SHA-1/SHA-256 no son obligatorios para FCM, pero útiles: SHA-1
     `B8:CB:27:6D:45:7E:83:5E:4C:47:68:EA:85:DD:18:F5:3D:28:B5:B5`).
   - Descarga **`google-services.json`**.
3. (Para iOS, más adelante) **Add app → iOS** con bundle id `com.elevate.paw` → `GoogleService-Info.plist`.

## 2. Colocar google-services.json (NO al repo)
- Ponlo en **`android/app/google-services.json`**. Ya está gitignored (`.gitignore`).
- El `build.gradle` de Paw ya aplica el plugin `com.google.gms.google-services` **si** el archivo
  existe (bloque try/catch al final de `android/app/build.gradle`). Sin el archivo, el build
  sigue (sin push). Con el archivo, hay que asegurar el classpath del plugin — ver §4.

## 3. Service account para que el backend envíe (consola) — lo haces tú
1. Firebase Console → ⚙ **Project settings → Service accounts → Generate new private key** →
   descarga el JSON (tiene `client_email` + `private_key`).
2. **Guárdalo en la bóveda** `D:\3_ELEVATE\.credentials\paw\firebase\` (NO al repo).
3. Carga los secrets en el Supabase de Paw (DEV y PROD):
   ```bash
   # project id de Firebase (NO el de Supabase); del google-services.json: project_info.project_id
   supabase secrets set FCM_PROJECT_ID=<firebase-project-id> --project-ref <ref>
   # el JSON completo de la service account, en una sola variable
   supabase secrets set FCM_SERVICE_ACCOUNT_JSON="$(cat ruta/al/service-account.json)" --project-ref <ref>
   ```
   Refs: PROD `xqjecrcpkngguokbywex`, DEV `qomzldpywoapcusavxqw`.

## 4. Gradle: classpath del plugin google-services
En `android/build.gradle` (nivel proyecto), dependencies de buildscript, asegurar:
```gradle
classpath 'com.google.gms:google-services:4.4.2'
```
(El `apply plugin` ya está condicionado en `android/app/build.gradle`.) Si falta el classpath, el
`cap sync`/build avisa. Añadirlo solo cuando `google-services.json` ya esté presente.

## 5. Migración de BD
Aplicar `supabase/migrations/20261111001_push_fcm_native.sql` en DEV y PROD (añade `fcm_token`,
relaja NOT NULL de Web Push, CHECK web-or-fcm). Por `db push` o SQL directo.

## 6. Probar en device (Android)
1. Build con `google-services.json` presente (`npx cap sync android` → AAB/APK).
2. Instalar en un device real, iniciar sesión → `useNativePush` pide permiso y guarda el token:
   verificar fila en `push_subscriptions` con `fcm_token` y `platform=android`.
3. Encolar una notificación (insert en `notification_queue` con `scheduled_for<=now`) o invocar
   `notification-processor` → debe llegar la push al teléfono.

## Checklist
- [ ] Proyecto Firebase + app Android `com.elevate.paw`
- [ ] `google-services.json` en `android/app/` (bóveda respalda copia)
- [ ] Service account JSON → secrets `FCM_PROJECT_ID` + `FCM_SERVICE_ACCOUNT_JSON` (DEV+PROD)
- [ ] classpath `google-services` en `android/build.gradle`
- [ ] Migración `20261111001_push_fcm_native.sql` aplicada (DEV+PROD)
- [ ] Token guardado en `push_subscriptions` al iniciar sesión en la app
- [ ] Push real recibida en device
