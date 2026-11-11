'use client'
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { useStore } from "@/store"
import { createClient } from "@/lib/supabase/client"
import { pendingInvite } from "@/lib/api/sharing"

/**
 * Carga las mascotas (propias y compartidas) al iniciar sesión, las mantiene
 * al día en tiempo real (foto, nombre o datos cambiados desde otra pantalla o
 * por otra persona con acceso) y aplica el tono de la mascota activa a la app.
 */
export function PetsLoader() {
  const { user } = useAuthContext()
  const { setCurrentUserId, fetchPets, syncPetRow } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const activeSex = useStore((s) => (s.pets.find((p) => p.id === s.selectedPetId) ?? s.pets[0])?.sex)

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id)
      void fetchPets()
    } else {
      setCurrentUserId(null)
    }
  }, [user, setCurrentUserId, fetchPets])

  // Al entrar o registrarse desde una invitación, se retoma donde iba
  useEffect(() => {
    if (!user || pathname?.startsWith("/invitacion")) return
    const token = pendingInvite()
    if (token) router.replace(`/invitacion/${token}`)
  }, [user, pathname, router])

  // Cambios en `pets` (RLS filtra a las que el usuario puede ver)
  useEffect(() => {
    if (!user) return
    const supabase = createClient()
    // El modo demo usa un cliente simulado sin realtime: ahí no se suscribe
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`pets:${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "pets" }, (payload: { eventType: string; new: Record<string, unknown> }) => {
          if (payload.eventType === "UPDATE") syncPetRow(payload.new)
          else void fetchPets()
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "pet_members", filter: `user_id=eq.${user.id}` }, () => void fetchPets())
        .subscribe()
    } catch {
      channel = null
    }
    return () => {
      if (channel) void supabase.removeChannel(channel)
    }
  }, [user, fetchPets, syncPetRow])

  // Tono de la app: rosado pastel cuando la mascota activa es hembra (tokens en tokens.css)
  useEffect(() => {
    const root = document.documentElement
    if (activeSex === "female") root.dataset.petTone = "rosa"
    else delete root.dataset.petTone
  }, [activeSex])

  return null
}
