'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Home, PawPrint, HeartPulse, Activity, Wallet, ImageIcon, Video, ShoppingBag } from 'lucide-react'

const ALL_ITEMS = [
  { label: 'Inicio', icon: Home, href: '/home' },
  { label: 'Mascotas', icon: PawPrint, href: '/mascotas' },
  { label: 'Salud', icon: HeartPulse, href: '/salud' },
  { label: 'Actividad', icon: Activity, href: '/actividad' },
  { label: 'Gastos', icon: Wallet, href: '/gastos' },
  { label: 'Galería', icon: ImageIcon, href: '/galeria' },
  { label: 'Videos', icon: Video, href: '/videos' },
  { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-black border-r border-[#1F1F1F] pt-8 px-3 fixed left-0 top-0 z-40">
      <div className="text-xl font-bold text-white px-3 mb-8">PAW 🐾</div>
      <nav className="flex flex-col gap-1">
        {ALL_ITEMS.map(({ label, icon: Icon, href }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              pathname.startsWith(href) ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white hover:bg-[#1F1F1F]'
            }`}>
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
