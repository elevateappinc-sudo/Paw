'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Home, PawPrint, HeartPulse, Activity, Grid2X2 } from 'lucide-react'
import { NAV_TABS, ACTIVE_PREFIXES } from './BottomNav.config'
import { MoreDrawer } from './MoreDrawer'

const ICONS = { Home, PawPrint, HeartPulse, Activity, Grid2X2 }

export function BottomNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isActive = (tabId: string) => {
    const prefix = ACTIVE_PREFIXES[tabId]
    return prefix ? pathname.startsWith(prefix) : false
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-[#1F1F1F] pb-safe md:hidden">
        <div className="flex items-center justify-around h-16">
          {NAV_TABS.map(tab => {
            const Icon = ICONS[tab.iconName as keyof typeof ICONS]
            const active = isActive(tab.id)

            if (tab.id === 'more') return (
              <button key={tab.id} onClick={() => setDrawerOpen(true)} className="flex flex-col items-center gap-1 flex-1 py-2">
                <Grid2X2 className={`w-6 h-6 ${active ? 'text-accent' : 'text-gray-500'}`} />
                <span className={`text-[10px] ${active ? 'text-accent font-semibold' : 'text-gray-500'}`}>Más</span>
              </button>
            )

            return (
              <Link key={tab.id} href={tab.route!} className="flex flex-col items-center gap-1 flex-1 py-2">
                <Icon className={`w-6 h-6 ${active ? 'text-accent' : 'text-gray-500'}`} strokeWidth={active ? 2.5 : 1.5} />
                <span className={`text-[10px] ${active ? 'text-accent font-semibold' : 'text-gray-500'}`}>{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
      <MoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  )
}
