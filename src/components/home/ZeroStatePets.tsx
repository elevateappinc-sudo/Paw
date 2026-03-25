import Link from 'next/link'
import { PawPrint } from 'lucide-react'

export function ZeroStatePets() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-8 text-center">
      <div className="text-8xl">🐾</div>
      <div>
        <h2 className="text-2xl font-bold text-white">¡Tu familia peluda te espera!</h2>
        <p className="text-gray-400 mt-2">Agrega tu primera mascota para comenzar a gestionar su salud y bienestar.</p>
      </div>
      <Link
        href="/mascotas/nueva"
        className="flex items-center gap-2 bg-accent text-black font-semibold px-8 py-4 rounded-2xl w-full max-w-xs justify-center hover:opacity-90 transition-opacity"
      >
        <PawPrint className="w-5 h-5" />
        Agregar mi primera mascota
      </Link>
    </div>
  )
}
