import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HomeView } from '@/components/home/HomeView'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: pets } = await supabase.from('pets').select('id, name, avatar_config').eq('owner_id', user.id)
  const hasPets = (pets?.length ?? 0) > 0
  const isNewUser = Date.now() - new Date(user.created_at).getTime() < 24 * 60 * 60 * 1000
  const onboardingCompleted = user.user_metadata?.onboarding_completed ?? false

  return <HomeView hasPets={hasPets} isNewUser={isNewUser} onboardingCompleted={onboardingCompleted} userId={user.id} pets={pets ?? []} />
}
