'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { AccountSettings } from '@/components/settings/AccountSettings'

export default function SettingsPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])
  if (loading || !user) return null
  return <AccountSettings />
}
