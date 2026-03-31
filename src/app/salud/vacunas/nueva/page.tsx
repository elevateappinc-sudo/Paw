'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
export default function NuevaVacunaPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/salud/vacunas?nueva=1') }, [router])
  return null
}
