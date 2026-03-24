import { PawPrint } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function ZeroStatePets() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-8 text-center">
      <div className="text-8xl">🐾</div>
      <div>
        <h2 className="text-2xl font-bold text-white">¡Tu familia peluda te espera!</h2>
        <p className="text-gray-400 mt-2">Agrega tu primera mascota para comenzar a gestionar su salud y bienestar.</p>
      </div>
      <Button variant="primary" className="w-full max-w-xs" asChild>
        <Link href="/mascotas/nueva">
          <PawPrint className="w-5 h-5" />
          Agregar mi primera mascota
        </Link>
      </Button>
    </div>
  )
}
