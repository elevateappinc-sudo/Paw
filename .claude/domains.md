# Dominios (Paw)

Paw es **single-tenant**: **un dominio por entorno**, no un dominio por cliente (a diferencia
de Gym, que genera un subdominio por gimnasio). Por eso acá **no** hay automatización de
subdominios en runtime — es config puntual al montar el entorno.

| Entorno | Dominio | Vercel | Supabase |
|---|---|---|---|
| **PROD** | `<dominio-prod>` (ej. `paw.app` / `app.paw…`) | deployment `production` | `xqjecrcpkngguokbywex` |
| **DEV** | `<dominio-dev>` (ej. `dev.paw…`) | deployment `main` | `qomzldpywoapcusavxqw` |

> ⚠️ Los dominios reales **se confirman con el lead** y se anotan acá. No inventarlos.
> `NEXT_PUBLIC_URL` de cada entorno debe apuntar a su dominio.

## Dónde vive cada capa (no confundir)

| Capa | Qué es | Dónde |
|---|---|---|
| **Registrador** | Dónde se compra/renueva el dominio | (según el dominio de Paw) |
| **DNS** | Dónde se gestionan los registros (CNAME/A/MX/TXT) + API | **Cloudflare** (preferido, gratis, con API) |
| **Hosting** | Dónde corre la app | **Vercel** |

> El ecosistema Elevate está centralizando el **DNS en Cloudflare** (ver el trabajo hecho para
> `elevateapp.co`). Si el dominio de Paw aún está en el DNS del registrador, lo ideal es
> delegarlo a Cloudflare también, para tener un solo panel + API.

## Agregar/configurar un dominio (por entorno)

### 1. En Vercel
Project (el deployment del entorno) → **Settings → Domains → Add** → escribir el dominio.
Vercel da el **target** a apuntar:
- Apex (`paw.app`) → registro **A** a la IP de Vercel que indique.
- Subdominio (`dev.paw.app`, `app.paw.app`) → **CNAME** al target `*.vercel-dns-###.com` que muestre.

### 2. En el DNS (Cloudflare o registrador)
Crear el registro que pidió Vercel. En **Cloudflare**: **DNS-only (nube gris)**, nunca proxied
(el SSL/CDN lo maneja Vercel; proxied rompe el challenge de certificado).

Por API de Cloudflare (si el DNS ya está delegado):
```bash
curl -sS -X POST "https://api.cloudflare.com/client/v4/zones/<ZONE_ID>/dns_records" \
  -H "Authorization: Bearer <CF_TOKEN>" -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"<sub>","content":"<target>.vercel-dns-017.com","ttl":1,"proxied":false}'
```

### 3. En Supabase (auth redirects)
Authentication → URL Configuration del proyecto del entorno:
- **Site URL** = el dominio del entorno.
- **Redirect URLs** = incluir `<dominio>/auth/callback` (OAuth usa redirect + PKCE, ver
  `docs/ios-pwa-oauth-spike.md`).
- Si usa Google Calendar OAuth: el redirect de Google también debe incluir el dominio.

### 4. En el código / env
- `NEXT_PUBLIC_URL` del entorno = el dominio (redirects de OAuth, push, OG).
- Revisar que no haya URLs hardcodeadas de otro entorno.

## Validar
```bash
# resuelve al target de Vercel
nslookup <dominio>
# SSL emitido (puede tardar minutos tras crear el CNAME)
curl -I https://<dominio>
```
Login + OAuth + push OK en el dominio nuevo.

## Nota para las tiendas (Capacitor)
Cuando se envuelva con Capacitor (ver `capacitor-build.md`), el dominio de **PROD** es el que
carga la app nativa (modo `server.url`) y el que debe quedar como **Associated Domain /
Universal Link** para que el callback de OAuth vuelva a la app y no abra Safari.
