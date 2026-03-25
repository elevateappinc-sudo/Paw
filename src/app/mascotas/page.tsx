'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useStore } from '@/store'

export default function MascotasPage() {
  const { user } = useAuthContext()
  const { pets, selectedPetId, selectPet } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) { router.replace('/login'); return }
    // Si hay una mascota seleccionada o solo una mascota, ir a su perfil
    if (selectedPetId) {
      router.replace(`/mascotas/${selectedPetId}`)
    } else if (pets.length === 1) {
      selectPet(pets[0].id)
      router.replace(`/mascotas/${pets[0].id}`)
    } else if (pets.length === 0) {
      router.replace('/home')
    }
  }, [user, pets, selectedPetId, selectPet, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
