'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NoUpcomingEvents } from './NoUpcomingEvents'

type Event = { id: string; type: string; title: string; petName: string; date: string }

export function UpcomingEventsSection({ userId }: { userId: string }) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const now = new Date().toISOString()
      const limit = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
      const results: Event[] = []

      // Vacunas
      try {
        const { data } = await supabase.from('vaccines').select('id, nombre, next_date, pets(name)').gte('next_date', now).lte('next_date', limit)
        ;(data ?? []).forEach((v: any) => results.push({ id: v.id, type: 'vaccine', title: v.nombre ?? 'Vacuna', petName: v.pets?.name ?? '', date: v.next_date }))
      } catch {}

      // Medicamentos
      try {
        const { data } = await supabase.from('medication_logs').select('id, medications(name), scheduled_at, medications(pet_id), pets:medications(pet_id(name))').eq('status', 'pending').gte('scheduled_at', now).lte('scheduled_at', limit)
        ;(data ?? []).forEach((m: any) => results.push({ id: m.id, type: 'medication', title: (m.medications as any)?.name ?? 'Medicamento', petName: '', date: m.scheduled_at }))
      } catch {}

      results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      setEvents(results.slice(0, 5))
      setLoading(false)
    }
    load()
  }, [userId])

  if (loading) return (
    <div className="px-4 space-y-3 py-4">
      {[1,2,3].map(i => <div key={i} className="h-14 bg-[#111111] rounded-xl animate-pulse" />)}
    </div>
  )

  return (
    <section className="py-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 px-4 mb-3">Próximos eventos</h2>
      {events.length === 0
        ? <NoUpcomingEvents />
        : (
          <div className="px-4 space-y-3">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-[#111111] rounded-xl border border-[#1F1F1F]">
                <span className="text-2xl">{e.type === 'vaccine' ? '💉' : e.type === 'medication' ? '💊' : '📅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{e.title}</p>
                  <p className="text-gray-500 text-xs">{new Date(e.date).toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </section>
  )
}
