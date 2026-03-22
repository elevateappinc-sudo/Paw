"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  type: "veterinaria" | "peluqueria" | "entrenamiento" | "tienda" | "otro" | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  logo_url: string | null;
  qr_token: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export function useBusinesses() {
  const { user } = useAuthContext();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setBusinesses((data as Business[]) ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchBusinesses();
  }, [fetchBusinesses]);

  const createBusiness = async (payload: Partial<Business>) => {
    if (!user) throw new Error("No autenticado");
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("businesses")
      .insert({ ...payload, owner_id: user.id })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await fetchBusinesses();
    return data as Business;
  };

  const updateBusiness = async (id: string, payload: Partial<Business>) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", id);
    if (err) throw new Error(err.message);
    await fetchBusinesses();
  };

  const regenerateQR = async (id: string) => {
    const supabase = createClient();
    const newToken = crypto.randomUUID();
    const { error: err } = await supabase
      .from("businesses")
      .update({ qr_token: newToken })
      .eq("id", id);
    if (err) throw new Error(err.message);
    await fetchBusinesses();
    return newToken;
  };

  return { businesses, loading, error, refetch: fetchBusinesses, createBusiness, updateBusiness, regenerateQR };
}
