# Build nativo con Capacitor — camino a App Store / Play (Paw)

> **Estado: NO montado.** Hoy Paw es un **PWA de Next.js** en Vercel. Esta guía es el **camino**
> para llevarlo a las tiendas envolviéndolo con Capacitor. Léela completa antes de empezar:
> con Next.js el enfoque es **distinto al de Gym** (que es Vite + export estático).

## ⚠️ Por qué Paw no puede hacer lo mismo que Gym

Gym-Users es **Vite** → genera un bundle estático que Capacitor empaqueta dentro del binario.

Paw es **Next.js 15 App Router** con **server components, rutas API** (`/auth/callback/route.ts`,
push, asistente IA) y **redirects** en `next.config.ts`. Eso **no** se exporta estático con
`output: 'export'` sin reescribir media app. Por eso, para Paw hay **dos caminos realistas**:

| Enfoque | Cómo | Pro / Contra |
|---|---|---|
| **A. WebView wrapper (`server.url`)** ✅ recomendado para MVP | Capacitor carga el **dominio de PROD** en vivo (la app nativa es un shell nativo sobre el PWA) | + Rápido, mantiene todas las features server. − Requiere conexión; riesgo de rechazo Apple 4.2 si parece "solo una web" (se mitiga con push nativo, splash, features reales) |
| **B. Export híbrido** | Separar un front estático y mover la lógica server a edge functions/API externas | + App más "nativa"/offline. − Mucho trabajo de reestructura |

Esta guía documenta el **camino A** (el viable a corto plazo). Si el lead quiere offline real,
se evalúa B como proyecto aparte.

---

## Decisiones previas (con el lead, antes de tocar nada)

- **Bundle id / App ID** (PERMANENTE, no se cambia): convención Elevate
  `com.elevate.<producto>.<específico>` → p. ej. `com.elevate.paw` o `com.elevate.petcare`.
- **Nombre en tienda**, ícono 1024×1024, splash, screenshots.
- **Dominio de PROD** que cargará la app (ver `domains.md`) — es el `server.url`.
- **Firma**: iOS usa la bóveda de firma de Elevate (`D:\3_ELEVATE\.credentials\ios\<marca>\`,
  team `VCKJSHHNDM`); Android necesita su **keystore** (crear y guardar fuera del repo).

---

## Paso a paso (camino A — WebView wrapper)

### 0. Requisitos de la máquina
Node 20+, Android Studio (Android), **Mac con Xcode** (iOS — iOS solo compila en Mac).

### 1. Instalar Capacitor en el repo

```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios @capacitor/android
npx cap init "Paw" "com.elevate.paw"   # nombre + bundle id (confirmados con el lead)
```

Esto crea `capacitor.config.ts`.

### 2. Configurar `capacitor.config.ts` en modo `server.url`

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elevate.paw',
  appName: 'Paw',
  // webDir apunta a un shell mínimo (Capacitor exige una carpeta con un index.html);
  // el contenido real se carga de server.url
  webDir: 'public',
  server: {
    url: 'https://<dominio-prod-de-paw>',   // el PWA en vivo (ver domains.md)
    cleartext: false,
  },
};

export default config;
```

> El `server.url` **debe** ser el dominio de **PROD**. Para builds de prueba se puede apuntar a
> DEV, pero el binario de tienda va contra PROD.

### 3. Agregar plataformas nativas

```bash
npx cap add ios
npx cap add android
```

Esto crea `ios/` y `android/` (van al repo; agregar al `.gitignore` lo que sea artefacto de build).

### 4. Push notifications nativas

El PWA usa **Web Push (VAPID)**; en nativo se usa **`@capacitor/push-notifications`**
(APNs en iOS, FCM en Android). Es un canal distinto:
```bash
npm install @capacitor/push-notifications
```
- iOS: APNs key en Apple Developer; registrar el token del dispositivo → guardarlo en Supabase.
- Android: `google-services.json` (FCM) en `android/app/`.
- El backend (edge functions `notification-processor` / push) debe saber enviar a tokens
  nativos además de Web Push. **Esto es trabajo de backend a planear**, no sale gratis.

### 5. Deep links / OAuth (crítico en iOS)

El callback de Google OAuth debe **volver a la app**, no abrir Safari:
- Configurar **Associated Domains / Universal Links** con el dominio de PROD (ver
  `docs/ios-pwa-oauth-spike.md` y `domains.md`).
- Mantener el flujo **redirect + PKCE** (ya implementado) — compatible con el WebView.

### 6. Íconos y splash

```bash
npm install -D @capacitor/assets
# colocar icon.png (1024×1024) y splash.png, luego:
npx cap assets generate
```

### 7. Sincronizar y abrir en los IDEs nativos

```bash
npx cap sync      # copia config/plugins a ios/ y android/
npx cap open ios      # Xcode (en Mac)
npx cap open android  # Android Studio
```

### 8. Firmar y compilar

- **Android**: configurar el **keystore** en `android/app/build.gradle` (signingConfigs).
  Generar el **AAB** firmado (`./gradlew bundleRelease`). Guardar el keystore + contraseña
  **fuera del repo** (permanente — sin él no se actualiza la app en Play).
- **iOS** (en Mac): usar la firma de Elevate (team `VCKJSHHNDM`, cert/p12/provisioning de la
  bóveda). Archive → export `.ipa`. OpenSSL3 puede requerir `-legacy` al manejar el `.p12`.

### 9. Publicar

- **Google Play Console**: subir el AAB, ficha, capturas, política de privacidad → revisión.
- **App Store Connect**: subir el `.ipa`, ficha, capturas, privacidad → revisión.
- ⚠️ **Apple 4.2 (minimum functionality):** un wrapper "solo web" puede ser rechazado.
  Mitigar: push nativo real, splash/ícono propios, experiencia de app (no barra de navegador),
  y features que se sientan nativas. Si rechazan, documentar y evaluar el camino B.

---

## Qué NO hacer
- No cambiar el **bundle id** una vez publicado.
- No commitear keystore, `.p12`, `provisioning`, ni `google-services.json` con secretos.
- No asumir que el push web ya cubre nativo — es otro canal (APNs/FCM) y requiere backend.
- No copiar los pasos de Gym-Users (Vite/export estático) tal cual: acá es `server.url`.

## Referencias
- Enfoque OAuth iOS PWA/standalone: `docs/ios-pwa-oauth-spike.md`.
- Dominios y Universal Links: `.claude/domains.md`.
- Firma iOS (bóveda Elevate): `D:\3_ELEVATE\.credentials\ios\<marca>\`.
