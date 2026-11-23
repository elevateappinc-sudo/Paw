# Publicar Paw a las tiendas

Guía específica de **este repo**. El procedimiento general de Google Play y App Store
(formularios, cuestionarios, Data safety, App Privacy, clasificación por edades) está
documentado una sola vez en **Gym-Infra**:

> `Gym-Infra/docs/manuales/publicar-app-a-tiendas.md`

Acá va únicamente lo que es **distinto en Paw** y que, si no se sabe, cuesta un ciclo de
revisión de varios días.

---

## 1. Paw NO empaqueta la web: la carga en vivo

Esta es la diferencia de fondo con Gym-Users y hay que entenderla antes de tocar nada.

`capacitor.config.ts` define `server.url`, así que el AAB es **un contenedor** que abre una
WebView apuntando a un dominio real. El HTML/JS no viaja dentro del binario.

| Entorno | Dominio |
|---|---|
| Producción (tienda) | `https://paw.elevateapp.co` |
| QA en dispositivo | `https://paw-dev.elevateapp.co` |
| Local | `http://<ip-LAN>:3004` (via `PAW_NATIVE_SERVER_URL`) |

**Consecuencias prácticas:**

- Un cambio desplegado en `paw.elevateapp.co` llega a los usuarios **sin pasar por Play**.
  No hay que resubir el AAB para corregir la mayoría de los bugs.
- Si producción se cae, **la app se cae en las tiendas**. No hay copia local que la salve.
- El revisor de Google abre la app y aterriza en lo que sirva ese dominio **ese día**.
  Antes de enviar a revisión, verificar que responde 200:

```bash
curl -sIL https://paw.elevateapp.co -o /dev/null -w "%{url_effective} -> %{http_code}\n"
# esperado: https://paw.elevateapp.co/login -> 200
```

- `allowNavigation` limita a qué dominios puede navegar la WebView sin abrir el navegador
  externo. Un dominio nuevo (p. ej. un proveedor de pagos) debe agregarse ahí o el flujo
  se sale de la app.

---

## 2. assetlinks.json es una ruta de Next, no un archivo estático

En Gym-Users vive en `public/.well-known/`. **Acá no**: se genera en

> `src/app/.well-known/assetlinks.json/route.ts`

Para cambiar las huellas se edita el array `SHA256_FINGERPRINTS` de ese archivo y se
**despliega la web**. No sirve subir un `.json` a `public/`.

### Las tres huellas, y por qué hacen falta las tres

| Huella | Origen | Cuándo aplica |
|---|---|---|
| Play App Signing | Google re-firma el AAB | instalación **desde la tienda** |
| upload / release | `paw-release.keystore` (bóveda) | el AAB que se sube + sideload de release |
| debug | `~/.android/debug.keystore` | APK de debug |

> **La de Play App Signing es la crítica.** Google re-firma el bundle con *su* clave antes
> de distribuirlo, así que es la única que ve un dispositivo que instaló desde la tienda.
> Si falta, los App Links no verifican y **el login con Google no vuelve a la app**.
> Se saca de: Play Console → Protegida con Play → Firma de aplicaciones → Huella SHA-256.

> Una sola huella mal formateada invalida **el documento entero** (`invalid_argument`),
> no solo esa entrada.

### Verificar contra Google (no basta con leer el archivo)

```bash
curl -s "https://digitalassetlinks.googleapis.com/v1/statements:list\
?source.web.site=https://paw.elevateapp.co\
&relation=delegate_permission/common.handle_all_urls"
```

Debe devolver **3 statements** para `com.elevate.paw`. Si devuelve menos, o un
`error`, los App Links están rotos aunque el JSON "se vea bien" en el navegador.

---

## 3. Compilar el AAB

El keystore **no está en el repo**: vive en `D:\3_ELEVATE\.credentials\paw\android\`.
Las credenciales se leen de propiedades de Gradle o variables de entorno — nunca
hardcodeadas (ver `android/app/build.gradle`).

```bash
npm run build          # Next
npx cap sync android   # copia config nativa
npm run android:build  # => android/app/build/outputs/bundle/release/app-release.aab
```

Con el keystore por `-P`:

```bash
cd android && ./gradlew bundleRelease \
  -PPAW_KEYSTORE_FILE=D:/3_ELEVATE/.credentials/paw/android/paw-release.keystore \
  -PPAW_KEYSTORE_PASSWORD=... -PPAW_KEY_ALIAS=... -PPAW_KEY_PASSWORD=...
```

> Si no se pasa `PAW_KEYSTORE_FILE`, el build **no falla**: genera un AAB **sin firmar**
> (es a propósito, para que CI corra sin secretos). Play lo rechaza al subirlo.

Subir el `versionCode` en `android/app/build.gradle` en cada entrega. Play rechaza un
`versionCode` repetido.

---

## 4. De prueba interna a producción

1. Play Console → **Prueba interna** → pestaña *Versiones*
2. **Promocionar versión → Producción**

Reusa el mismo AAB y el mismo `versionCode` ya validado. No recompila nada.

### Si "Producción" sale deshabilitado

Dice *"El canal ya tiene una versión en borrador"*. Play solo admite **un borrador por
canal**. Dos salidas:

- **Completar ese borrador** (Producción → Versiones → *Editar versión*). Si ya tiene el
  AAB cargado, es el camino corto: es la misma versión.
- **Descartarlo** (*Descartar versión en borrador*) y volver a promover.

### Porcentaje de lanzamiento

Para una actualización sobre base instalada, empezar en **20%** y subir. Play **no deja
bajar** el porcentaje una vez publicado, solo frenar el despliegue. Para una v1.0 sin
usuarios el 100% es aceptable.

---

## 5. Lo que más rechaza: Acceso a la app

Paw abre en `/login`. **Content → Acceso a la app** debe llevar usuario y contraseña
válidos **de producción**. Si el revisor no puede entrar, el rechazo es automático y se
pierde el ciclo completo de días.

Las credenciales de revisión van a la bóveda local, **nunca al repo**.

---

## 6. iOS

Sin publicar todavía. Cuando toque, aplica todo lo de
`Gym-Infra/docs/manuales/publicar-app-a-tiendas.md` §11, más:

- Las capturas de Play **no sirven**: App Store exige 1290×2796 exactos.
- Capturar a 430×932 (puntos lógicos del iPhone 16 Pro Max) y escalar ×3. A 1290 de ancho
  directo, la web renderiza su layout de **escritorio** y no parece un teléfono.
- El equivalente de los App Links son los *universal links*: se declaran en
  `ios/App/App/App.entitlements` (`applinks:paw.elevateapp.co`) y requieren servir
  `/.well-known/apple-app-site-association` — **otra ruta de Next por crear**.

---

## Estado actual

| | |
|---|---|
| Google Play | **enviada a revisión** (2026-11-23), v1.0 `versionCode 1`, CO + PE, 100% |
| App Store | sin empezar |
| assetlinks | 3 huellas publicadas y validadas contra Google ✅ |
