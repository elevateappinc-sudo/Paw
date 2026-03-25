'use client'
import { useEffect, useRef } from 'react'
import { X, Wallet, ImageIcon, Video, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

const DRAWER_ITEMS = [
  { label: 'Gastos', icon: Wallet, href: '/gastos' },
  { label: 'Galería', icon: ImageIcon, href: '/galeria' },
  { label: 'Videos', icon: Video, href: '/videos' },
  { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
]

export function MoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    // Focus primer elemento interactivo al abrir
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>('button, a')
    firstFocusable?.focus()

    // Cerrar con Escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Más módulos"
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl border-t border-[#1F1F1F] p-6 pb-safe animate-slide-up"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold">Más módulos</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar menú"
            className="text-gray-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DRAWER_ITEMS.map(({ label, icon: Icon, href }) => (
            <Link
              key={label}
              href={href}
              onClick={onClose}
              className="flex flex-col items-center gap-3 p-4 bg-surface-2 rounded-2xl border border-[#1F1F1F] hover:border-accent transition-colors"
            >
              <Icon className="w-7 h-7 text-accent" aria-hidden="true" />
              <span className="text-white text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
