'use client'
import { usePathname } from 'next/navigation'

const PUBLIC_ROUTES = ['/login', '/register', '/auth', '/join', '/shared']

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
}

export function NavGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (isPublicRoute(pathname)) return null
  return <>{children}</>
}

export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const pub = isPublicRoute(pathname)
  return (
    <div style={pub ? {} : { marginLeft: 0 }}>
      <style>{`@media (min-width: 768px) { .main-with-sidebar { margin-left: 72px !important; } }`}</style>
      <div className={pub ? '' : 'main-with-sidebar'}>
        {children}
      </div>
    </div>
  )
}
