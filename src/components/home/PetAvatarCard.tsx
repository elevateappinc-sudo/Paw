'use client'
import Link from 'next/link'

export function PetAvatarCard({ pet }: { pet: { id: string; name: string; avatar_config?: { url?: string } } }) {
  return (
    <Link href={`/mascotas/${pet.id}`} className="flex flex-col items-center gap-2 shrink-0">
      <div className="w-16 h-16 rounded-full bg-[#1F1F1F] border-2 border-accent flex items-center justify-center overflow-hidden">
        {pet.avatar_config?.url
          ? <img src={pet.avatar_config.url} alt={pet.name} className="w-full h-full object-cover" />
          : <span className="text-3xl">🐾</span>
        }
      </div>
      <span className="text-xs text-white font-medium truncate max-w-[64px]">{pet.name}</span>
    </Link>
  )
}
