'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/lib/supabase/updateUserMetadata'

const SLIDES = [
  { title: '¡Bienvenido a PAW! 🐾', desc: 'Tu compañero digital para cuidar lo que más quieres.', emoji: '🏠' },
  { title: 'Todo bajo control', desc: 'Vacunas, medicamentos, entrenamiento y más en un solo lugar.', emoji: '💊' },
  { title: '¡Empecemos!', desc: 'Agrega tu primera mascota y comienza la aventura.', emoji: '🐶' },
]

export function OnboardingFlow() {
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(false)
  const touchStartX = useRef<number>(0)
  const router = useRouter()

  const handleComplete = async () => {
    setLoading(true)
    await completeOnboarding()
    router.refresh()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) < 50) return
    if (diff > 0 && current < 2) setCurrent(c => c + 1)
    if (diff < 0 && current > 0) setCurrent(c => c - 1)
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-black text-white px-6 py-8 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button onClick={handleComplete} disabled={loading} className="self-end text-sm text-gray-400 hover:text-white transition-colors">
        Saltar
      </button>
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        <div className="text-8xl">{SLIDES[current].emoji}</div>
        <h1 className="text-3xl font-bold">{SLIDES[current].title}</h1>
        <p className="text-gray-400 text-lg max-w-sm">{SLIDES[current].desc}</p>
      </div>
      <div className="flex justify-center gap-2 mb-6" role="tablist" aria-label="Progreso del onboarding">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1} de ${SLIDES.length}`}
            className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-accent' : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <button
        onClick={() => current < 2 ? setCurrent(c => c + 1) : handleComplete()}
        disabled={loading}
        className="w-full bg-accent text-black font-semibold py-4 rounded-2xl text-base disabled:opacity-50"
      >
        {loading ? 'Cargando...' : current < 2 ? 'Siguiente' : 'Comenzar'}
      </button>
    </div>
  )
}
