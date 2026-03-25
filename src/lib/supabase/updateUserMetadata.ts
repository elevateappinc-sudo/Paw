'use server'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding() {
  const supabase = await createClient()
  await supabase.auth.updateUser({ data: { onboarding_completed: true } })
}
