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
    <div className={pub ? '' : 'md:ml-56'}>
      {children}
    </div>
  )
}
