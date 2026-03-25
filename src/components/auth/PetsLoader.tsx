'use client'
import { useEffect } from "react"
import { useAuthContext } from "@/contexts/AuthContext"
import { useStore } from "@/store"

export function PetsLoader() {
  const { user } = useAuthContext()
  const { setCurrentUserId, fetchPets } = useStore()

  useEffect(() => {
    if (user) {
      setCurrentUserId(user.id)
      void fetchPets()
    } else {
      setCurrentUserId(null)
    }
  }, [user, setCurrentUserId, fetchPets])

  return null
}
