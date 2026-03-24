'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Entrenamiento', href: '/actividad/entrenamiento' },
  { label: 'Itinerario', href: '/actividad/itinerario' },
]

export default function ActividadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="sticky top-0 bg-black border-b border-[#1F1F1F] z-40">
        <div className="flex overflow-x-auto px-4 gap-1 py-3" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <Link key={tab.href} href={tab.href}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                pathname === tab.href ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'
              }`}>
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}
