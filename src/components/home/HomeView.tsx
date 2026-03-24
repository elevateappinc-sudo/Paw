'use client'
import { OnboardingFlow } from './onboarding/OnboardingFlow'
import { ZeroStatePets } from './ZeroStatePets'
import { PetsSection } from './PetsSection'
import { UpcomingEventsSection } from './UpcomingEventsSection'
import { QuickActionsSection } from './QuickActionsSection'

interface HomeViewProps {
  hasPets: boolean
  isNewUser: boolean
  onboardingCompleted: boolean
  userId: string
  pets: Array<{ id: string; name: string; avatar_config?: { url?: string } }>
}

export function HomeView({ hasPets, isNewUser, onboardingCompleted, userId, pets }: HomeViewProps) {
  if (isNewUser && !hasPets && !onboardingCompleted) return <OnboardingFlow />
  if (!hasPets) return <ZeroStatePets />

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold text-white">Hola 👋</h1>
        <p className="text-gray-400 text-sm">¿Cómo están tus mascotas hoy?</p>
      </div>
      <PetsSection pets={pets} />
      <UpcomingEventsSection userId={userId} />
      <QuickActionsSection />
    </div>
  )
}
