'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function NuevoEntrenamientoPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/actividad/entrenamiento?nuevo=1') }, [router])
  return null
}
