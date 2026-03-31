'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/contexts/AuthContext'
import { PhotoGallery } from '@/components/gallery/PhotoGallery'

export default function VideosPage() {
  const { user, loading } = useAuthContext()
  const router = useRouter()
  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])
  if (loading || !user) return null
  // PhotoGallery ya maneja tanto fotos como videos
  return <PhotoGallery />
}
