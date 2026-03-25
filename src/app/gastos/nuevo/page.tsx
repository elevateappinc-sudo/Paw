'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function NuevoGastoPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/gastos?nuevo=1') }, [router])
  return null
}
