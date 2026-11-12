# OAuth con redirect al navegador + regreso a la app (App Links) — Paw

> **Enfoque actual (Fase 3):** en la app nativa, el login con Google abre el **navegador del
> sistema**; al terminar, el callback **vuelve a la app** vía **App Links** (Android) /
> Universal Links (iOS). En una fase futura se puede cambiar a login nativo (sin navegador).
> En web/PWA no cambia nada.

## Flujo (nativo)
```
Botón "Continuar con Google"
  → signInWithOAuth({ skipBrowserRedirect: true })  → Supabase devuelve la URL de Google
  → Browser.open(url)                                → navegador del sistema (Google)
  → usuario autentica en Google
  → Google redirige a https://<dominio>/auth/callback?code=...
  → App Link (assetlinks.json + intent-filter) abre la APP con esa URL  → evento appUrlOpen
  → DeepLinkHandler: cierra el navegador + navega el WebView a /auth/callback?code=...
  → /auth/callback (server) hace exchangeCodeForSession con las cookies del WebView  → sesión lista
```
En **web/PWA** `skipBrowserRedirect` es false → el navegador redirige normal y el callback hace
el exchange como siempre.

## Piezas
- **`src/hooks/useAuth.ts` → `signInWithGoogle`**: bifurca por `Capacitor.isNativePlatform()`.
  En nativo usa `skipBrowserRedirect:true` + `@capacitor/browser` para abrir la URL.
- **`src/components/auth/DeepLinkHandler.tsx`** (montado en el layout, sin UI): escucha
  `appUrlOpen`, cierra el navegador y lleva el WebView al callback. No-op en web.
- **`src/app/.well-known/assetlinks.json/route.ts`**: declara que `com.elevate.paw` es dueño del
  dominio (fingerprints SHA-256 release + debug). Se sirve en
  `https://<dominio>/.well-known/assetlinks.json`.
- **`android/app/src/main/AndroidManifest.xml`**: intent-filter con `autoVerify="true"` para
  `https://paw.elevateapp.co/auth/callback` y `https://paw-dev.elevateapp.co/auth/callback`.

## Requisitos para que verifique (Android App Links)
1. El **assetlinks.json** debe estar servido y accesible públicamente en el dominio:
   `https://paw.elevateapp.co/.well-known/assetlinks.json` (y `paw-dev` para QA). Ya lo sirve Next.
2. El **SHA-256** del certificado que firma el APK/AAB debe estar en ese assetlinks.json:
   - release (bóveda): `8B:76:4C:...:7C:0C`
   - debug: `63:30:82:...:B0:10`
   - ⚠️ **Play App Signing:** si Play re-firma la app, añadir también el SHA-256 que muestre
     **Play Console → App integrity → App signing key certificate** (si no, los App Links no
     verifican en las instalaciones desde Play).
3. **Supabase → Auth → URL Configuration → Redirect URLs** debe incluir
   `https://paw.elevateapp.co/auth/callback` (ya está para web; sirve igual para nativo).
4. El redirect del OAuth client de Google ya apunta al callback de Supabase (no cambia).

## Probar (device Android)
1. Build con el assetlinks ya desplegado en el dominio (deploy a Vercel primero).
2. Instalar el APK/AAB firmado; verificar App Links:
   `adb shell pm get-app-links com.elevate.paw` → debe decir "verified" para el dominio.
3. Login con Google → abre el navegador → tras autenticar, **vuelve solo a la app** logueado.
4. Si no verifica: revisar que el SHA-256 del certificado instalado esté en assetlinks.json y que
   el archivo sea accesible (sin redirecciones, Content-Type application/json).

## Nota (fase futura)
Para login **sin navegador** (hoja nativa de Google), usar el SDK nativo
(`@capacitor-firebase/authentication` → `signInWithGoogle` → `signInWithIdToken`). Ese enfoque
no necesita App Links para el login. Se dejó para una fase posterior por decisión del lead.
