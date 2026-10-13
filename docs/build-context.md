# Paw · contexto de construcción (para quien implemente módulos)

Lee esto antes de tocar código. La fuente de verdad del producto es el PRD
(`docs/PRD` en Claude Docs) y el sistema de diseño (acento salvia, base lino).

## Stack
- Next.js 15 App Router, React 19, TypeScript estricto, Tailwind v4 (tokens en `src/app/globals.css` vía `@theme inline`).
- `motion` (Framer Motion v14) para animación: variantes en `src/lib/motion.ts`. Respetar `useReducedMotion`.
- Supabase (SSR client en `src/lib/supabase/{client,server}.ts`). Las migraciones nuevas están en `supabase/migrations/20261007*.sql`. Los tipos de esas tablas en `src/types/db.ts`.
- Estado global: Zustand en `src/store/index.ts` (mascotas, selección). Para datos de módulos usa las funciones de `src/lib/api/*` con `useEffect`/estado local u optimistic updates; no añadas más al store salvo necesidad.
- Iconos: `lucide-react`. Nunca emoji en la UI.

## Tokens (clases Tailwind disponibles)
Colores: `bg-bg`, `bg-surface`, `bg-surface-2`, `bg-surface-3`, `text-on`, `text-on-variant`, `border-outline`, `border-outline-variant`,
`bg-primary text-on-primary`, `bg-primary-container text-on-primary-container`,
`bg-info-container text-on-info-container text-info`, `bg-ok-container text-on-ok-container text-ok`,
`bg-warn-container text-on-warn-container text-warn`, `bg-danger-container text-on-danger-container text-danger`.
Radios: `rounded-control` (12), `rounded-card` (16), `rounded-card-lg` (20), `rounded-sheet` (28), `rounded-full` para botones y chips.
Sombras: `shadow-1`, `shadow-2`, `shadow-3`. Vidrio: clase `glass`. Tipografía de títulos: `font-display` (Figtree 800).
Nunca uses hex ni `style={{}}` para color; todo por tokens. Claro y oscuro salen solos.

## Kit de UI (`src/components/ui`)
`Button` (variant primary|tonal|secondary|outline|ghost|danger|dangerTonal, size sm|md|lg|icon, full, loading, leading/trailing),
`Card` (tone surface|container|primary|warn|info|danger, elevation 0-3, padded, interactive), `CardHeader`, `SectionTitle`, `InfoCell`, `Row`, `Divider`,
`Sheet` (bottom sheet arrastrable: open, onClose, title, subtitle, footer), `Skeleton`/`SkeletonRow`/`SkeletonBiz`/`SkeletonPets`,
`EmptyState` (title, description, action, secondary, icon, tone), `ProgressRing`/`ProgressBar`, `SegmentedControl`/`Tabs`,
`Chip`/`ChipRow`/`Tag` (tone neutral|primary|ok|warn|info|danger), `PhotoBadge`/`Rating`/`Verified`/`Dot`,
`Input`/`Textarea`/`Select`/`Toggle`, `PetAvatarRing`, `PageHeader` (title, eyebrow, back, actions, sos), `showToast(msg, retry?, tone?)`.
Layout: `src/components/layout/{AppShell,TabBar,SOSButton,OfflineBanner}`. La tab bar tiene 4 destinos: /home, /mascotas, /explorar, /citas.
Rutas a pantalla completa (sin tab bar): /mascotas/nueva, /onboarding, /sos, /reservar, /negocios/*, /eventos/*, /asistente, /perdida.

## Reglas de diseño (resumen)
- Fotos de mascota sin texto encima. Nombre debajo. Mascota activa con anillo `PetAvatarRing active`.
- Objetivos táctiles ≥ 44 px. Etiquetas de texto además de color en todo estado.
- SOS arriba a la derecha en toda pantalla (lo pone `PageHeader`). Urgencias en 2 toques.
- Un solo elemento fuerte por pantalla (banner o CTA). Resto neutro.
- Estados obligatorios en cada pantalla con datos: cargando (skeleton con la misma geometría), vacío (`EmptyState`), error (mensaje + reintentar).
- Cada pantalla nueva: `loading.tsx` en su carpeta de ruta con skeletons.
- Español neutro, trato de tú, sin tecnicismos. Moneda COP con `formatCurrency`.
- Animación: entrada de listas escalonada (`stagger`/`fadeUp`), hojas con `Sheet`, check animado al completar. Nada > 300 ms salvo celebraciones.

## Datos
- Mascota activa: hook `useActivePet()` (`src/hooks/useActivePet.ts`), lee `?pet=` o el store.
- Ubicación: `useGeolocation()` (`src/hooks/useGeolocation.ts`); nunca pedir permiso al abrir la app, solo al entrar a Explorar con el motivo delante. `DEFAULT_CENTER` = Chapinero, Bogotá.
- APIs: `src/lib/api/careCycles.ts` (ciclos: fetch, complete via RPC, urgencia, progreso, dueLabel), `pets.ts` (perfil v2, peso, ración diaria, recompra, tóxicos, edad), `businesses.ts` (nearby RPC, ficha, servicios, reseñas, guardados, panel), `bookings.ts` (reservas, franjas), `events.ts`, `lostPets.ts` (alertas, ficha de emergencia, ubicación del usuario). Las APIs antiguas (`expenses`, `training`, `itinerary`, `notifications`, `vaccines`) siguen funcionando.
- Las migraciones aún no se han aplicado al proyecto remoto (no hay acceso desde esta máquina). El código debe fallar con elegancia (toast + estado vacío) si una tabla no existe.

## Calidad
- `npx tsc --noEmit` sin errores en tus archivos. `npm run lint` limpio.
- No tocar `src/components/ui/*` ni `globals.css` sin avisar; si te falta un primitivo, créalo dentro de tu módulo.
- No commits. No instalar paquetes nuevos.
