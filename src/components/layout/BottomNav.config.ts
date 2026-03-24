export const NAV_TABS = [
  { id: 'home', label: 'Inicio', route: '/home', iconName: 'Home' },
  { id: 'mascotas', label: 'Mascotas', route: '/mascotas', iconName: 'PawPrint' },
  { id: 'salud', label: 'Salud', route: '/salud', iconName: 'HeartPulse' },
  { id: 'actividad', label: 'Actividad', route: '/actividad', iconName: 'Activity' },
  { id: 'more', label: 'Más', route: null, iconName: 'Grid2X2' },
] as const

export const ACTIVE_PREFIXES: Record<string, string> = {
  home: '/home',
  mascotas: '/mascotas',
  salud: '/salud',
  actividad: '/actividad',
}
