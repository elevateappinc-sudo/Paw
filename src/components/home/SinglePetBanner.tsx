'use client'
import Link from 'next/link'

export function SinglePetBanner({ pet }: { pet: { id: string; name: string; avatar_config?: { url?: string } } }) {
  return (
    <Link href={`/mascotas/${pet.id}`} className="flex items-center gap-4 mx-4 p-4 bg-[#111111] rounded-2xl border border-[#1F1F1F]">
      <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border-2 border-accent flex items-center justify-center overflow-hidden shrink-0">
        {pet.avatar_config?.url
          ? <img src={pet.avatar_config.url} alt={pet.name} className="w-full h-full object-cover" />
          : <span className="text-3xl">🐾</span>
        }
      </div>
      <div>
        <p className="text-gray-400 text-sm">Mi mascota</p>
        <p className="text-white font-bold text-xl">{pet.name}</p>
        <p className="text-accent text-xs mt-1">Ver perfil →</p>
      </div>
    </Link>
  )
}
