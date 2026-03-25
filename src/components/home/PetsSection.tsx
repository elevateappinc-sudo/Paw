import { PetAvatarCard } from './PetAvatarCard'
import { SinglePetBanner } from './SinglePetBanner'

type Pet = { id: string; name: string; avatar_config?: { url?: string } }

export function PetsSection({ pets }: { pets: Pet[] }) {
  if (pets.length === 0) return null
  if (pets.length === 1) return <div className="py-4"><SinglePetBanner pet={pets[0]} /></div>

  return (
    <section className="py-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 px-4 mb-3">Mis mascotas</h2>
      <div className="flex gap-4 overflow-x-auto px-4 pb-2" style={{ scrollbarWidth: 'none' }}>
        {pets.map(pet => <PetAvatarCard key={pet.id} pet={pet} />)}
      </div>
    </section>
  )
}
