'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useStore } from '@/store'
import { PetAvatar } from '@/components/pets/PetAvatar'
import { PetForm } from '@/components/pets/PetForm'
import { Plus } from 'lucide-react'

export default function MascotasPage() {
  const { user, loading } = useAuthContext()
  const { pets, selectPet } = useStore()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
  }, [user, loading, router])

  // Auto-redirect when there's exactly one pet
  useEffect(() => {
    if (!loading && user && pets.length === 1 && !showForm) {
      selectPet(pets[0].id)
      router.replace(`/mascotas/${pets[0].id}`)
    }
  }, [loading, user, pets, showForm, selectPet, router])

  if (loading || !user) return null
  if (pets.length === 1 && !showForm) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-black pb-28">
      {/* Header */}
      <div className="px-5 pt-10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">PAW</p>
        <h1 className="text-3xl font-bold text-white">Mis mascotas</h1>
        {pets.length > 0 && (
          <p className="text-gray-500 text-sm mt-1">
            {pets.length} mascota{pets.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* New pet form */}
      {showForm && (
        <PetForm onClose={() => setShowForm(false)} />
      )}

      {/* Pet list — vertical cards */}
      {pets.length > 0 && (
        <div className="px-5 flex flex-col gap-3">
          {pets.map(pet => (
            <button
              key={pet.id}
              onClick={() => {
                selectPet(pet.id)
                router.push(`/mascotas/${pet.id}`)
              }}
              className="flex items-center gap-4 w-full bg-[#111111] rounded-2xl p-4 border border-[#1F1F1F] active:scale-[0.98] transition-transform text-left group"
            >
              <PetAvatar pet={pet} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-lg leading-tight truncate">{pet.name}</p>
                <p className="text-gray-500 text-sm capitalize mt-0.5">{pet.species}</p>
              </div>
              <div className="text-gray-600 group-hover:text-accent transition-colors">
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {pets.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#111] border border-[#1F1F1F] flex items-center justify-center mb-5 text-4xl">
            🐾
          </div>
          <p className="text-white text-xl font-semibold mb-2">Sin mascotas aún</p>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Agrega tu primera mascota<br/>para comenzar a usar PAW
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-8 py-3.5 bg-accent text-white rounded-2xl font-semibold text-base"
          >
            Agregar mascota
          </button>
        </div>
      )}

      {/* Floating add button (when there are pets) */}
      {pets.length > 0 && !showForm && (
        <div className="px-5 mt-4">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-3 w-full bg-[#111111] rounded-2xl p-4 border border-dashed border-[#2a2a2a] hover:border-accent/40 transition-colors text-gray-500 hover:text-gray-400"
          >
            <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">Agregar otra mascota</span>
          </button>
        </div>
      )}
    </div>
  )
}
