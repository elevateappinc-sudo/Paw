import Link from 'next/link'

export function NoUpcomingEvents() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span className="text-4xl">✅</span>
      <p className="text-white font-semibold">¡Todo al día! 🐾</p>
      <p className="text-gray-400 text-sm">No tienes eventos pendientes en los próximos 3 días</p>
      <Link href="/mascotas" className="text-accent text-sm underline">Agregar evento</Link>
    </div>
  )
}
