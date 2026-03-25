'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { useStore } from '@/store'
import { PetAvatar } from '@/components/pets/PetAvatar'
import { Dashboard } from '@/components/Dashboard'
import { GastosModule } from '@/components/gastos/GastosModule'
import { VacunasModule } from '@/components/vacunas/VacunasModule'
import { MedicationsModule } from '@/components/medications/MedicationsModule'
import { ClinicalRecordsModule } from '@/components/clinical/ClinicalRecordsModule'
import { EntrenamientoModule } from '@/components/entrenamiento/EntrenamientoModule'
import { ItinerarioModule } from '@/components/itinerario/ItinerarioModule'
import { PetInfoModule } from '@/components/pets/PetInfoModule'
import { ChevronLeft } from 'lucide-react'

const TABS = [
  { id: 'dashboard', label: 'Resumen' },
  { id: 'salud',     label: 'Salud' },
  { id: 'gastos',    label: 'Gastos' },
  { id: 'entrena',   label: 'Entrena' },
  { id: 'info',      label: 'Info' },
] as const

type Tab = typeof TABS[number]['id']

export default function MascotaDetailPage() {
  const { user, loading } = useAuthContext()
  const { pets, selectedPetId, selectPet } = useStore()
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (petId && selectedPetId !== petId) selectPet(petId)
  }, [user, loading, petId, selectedPetId, selectPet, router])

  const pet = pets.find(p => p.id === petId)

  if (loading || !user) return null

  if (!pet) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const accentColor = pet.color ?? '#0a84ff'

  return (
    <div className="min-h-screen bg-black pb-28">

      {/* Hero header */}
      <div className="relative pt-12 pb-6 px-5"
        style={{ background: `linear-gradient(180deg, ${accentColor}18 0%, transparent 100%)` }}>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Mascotas</span>
        </button>

        {/* Pet identity */}
        <div className="flex items-center gap-4">
          <div style={{ borderRadius: 24, border: `2px solid ${accentColor}44` }}>
            <PetAvatar pet={pet} size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">{pet.name}</h1>
            <p className="text-gray-400 text-sm capitalize mt-0.5">{pet.species}</p>
            {pet.breed && (
              <p className="text-gray-600 text-xs mt-0.5">{pet.breed}</p>
            )}
          </div>
        </div>
      </div>

      {/* iOS-style pill tab bar */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#1F1F1F]">
        <div className="flex gap-1.5 px-4 py-2.5 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              style={activeTab === tab.id
                ? { backgroundColor: accentColor }
                : { backgroundColor: '#1a1a1a' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'salud' && (
          <div>
            <VacunasModule />
            <MedicationsModule />
            <ClinicalRecordsModule />
          </div>
        )}
        {activeTab === 'gastos' && <GastosModule />}
        {activeTab === 'entrena' && (
          <div>
            <EntrenamientoModule />
            <ItinerarioModule />
          </div>
        )}
        {activeTab === 'info' && <PetInfoModule />}
      </div>
    </div>
  )
}
