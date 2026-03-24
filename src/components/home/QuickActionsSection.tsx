'use client'
import Link from 'next/link'
import { Wallet, Syringe, Dumbbell, PawPrint } from 'lucide-react'

const ACTIONS = [
  { label: 'Registrar gasto', icon: Wallet, href: '/gastos/nuevo' },
  { label: 'Nueva vacuna', icon: Syringe, href: '/salud/vacunas/nueva' },
  { label: 'Entrenamiento', icon: Dumbbell, href: '/actividad/entrenamiento/nuevo' },
  { label: 'Ver mascota', icon: PawPrint, href: '/mascotas' },
]

export function QuickActionsSection() {
  return (
    <section className="py-4 px-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-3">Acceso rápido</h2>
      <div className="grid grid-cols-2 gap-3">
        {ACTIONS.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} className="flex flex-col items-center gap-2 p-4 bg-[#111111] rounded-2xl border border-[#1F1F1F] hover:border-accent transition-colors">
            <Icon className="w-6 h-6 text-accent" />
            <span className="text-white text-xs font-medium text-center">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
