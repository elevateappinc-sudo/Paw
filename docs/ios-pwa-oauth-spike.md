# Spike: OAuth en iOS Safari / PWA Standalone

## Contexto

Este documento registra el comportamiento conocido de OAuth (Google) en iOS Safari y en modo PWA standalone (añadida a la pantalla de inicio).

## Problema

iOS PWA standalone mode no permite ventanas popup. Cuando un OAuth flow intenta abrir un popup (window.open), este es bloqueado silenciosamente por el sistema, causando que el usuario quede en la pantalla de login sin feedback.

## Comportamiento por plataforma

| Plataforma | Popup | Redirect | Notas |
|---|---|---|---|
| iOS Safari (browser) | ✅ funciona | ✅ funciona | Normal |
| iOS PWA standalone | ❌ bloqueado | ✅ funciona | Popup falla silenciosamente |
| Android Chrome | ✅ funciona | ✅ funciona | Normal |
| Android PWA | ✅ funciona | ✅ funciona | Normal |
| Desktop Chrome/Firefox | ✅ funciona | ✅ funciona | Normal |

## Solución Implementada

### 1. Usar `redirect` mode (no popup)

Supabase Auth usa redirect por defecto con `signInWithOAuth`. No usar `skipBrowserRedirect: true` ni forzar popup.

```typescript
supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

### 2. PKCE Flow (recomendado para PWA)

En la configuración de Supabase client, usar `flowType: 'pkce'` para mayor seguridad y compatibilidad con iOS:

```typescript
// src/lib/supabase/client.ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
      },
    }
  )
}
```

PKCE (Proof Key for Code Exchange) es el flujo recomendado para apps móviles y PWAs. Evita ataques de interceptación del code.

### 3. Callback Route

El callback en `/auth/callback/route.ts` maneja el `code` exchange correctamente tanto para redirect como para PKCE.

## Consideraciones adicionales

### Deep links en iOS PWA

Si el usuario está en PWA standalone y Google redirige al callback URL, iOS puede abrir Safari en lugar de volver a la PWA. Para mitigar:

- Asegurarse que el dominio esté configurado como Associated Domain en el proyecto nativo (si aplica)
- Considerar Universal Links para PAW iOS en el futuro

### Session persistence

En iOS PWA, las cookies de terceros pueden ser bloqueadas. Supabase SSR usa cookies propias (`sb-*`), lo cual es compatible.

### Testing

Para probar OAuth en iOS PWA:
1. Añadir app a pantalla de inicio
2. Abrir desde ícono (no desde Safari)
3. Intentar login con Google
4. Verificar que el redirect funciona y la sesión se establece

## Referencias

- [Supabase Auth Helpers - PKCE](https://supabase.com/docs/guides/auth/pkce-flow)
- [Apple - Universal Links](https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app)
- [WebKit - Storage Access API](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)
