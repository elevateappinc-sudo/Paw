"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  qr_token: string;
  qr_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useBusinesses() {
  const { user } = useAuthContext();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setBusinesses((data ?? []) as Business[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { void fetchBusinesses(); }, [fetchBusinesses]);

  const createBusiness = useCallback(async (name: string, description?: string) => {
    if (!user) return null;
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("businesses")
      .insert({ owner_id: user.id, name, description: description ?? null })
      .select()
      .single();
    if (err) throw new Error(err.message);
    await fetchBusinesses();
    return data as Business;
  }, [user, fetchBusinesses]);

  const updateBusiness = useCallback(async (id: string, updates: Partial<Pick<Business, "name" | "description" | "logo_url">>) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("businesses")
      .update(updates)
      .eq("id", id);
    if (err) throw new Error(err.message);
    await fetchBusinesses();
  }, [fetchBusinesses]);

  const refreshQrToken = useCallback(async (id: string) => {
    const supabase = createClient();
    // Generate new token by calling RPC or just refreshing via service
    const { error: err } = await supabase
      .from("businesses")
      .update({ qr_token: crypto.randomUUID() })
      .eq("id", id);
    if (err) throw new Error(err.message);
    await fetchBusinesses();
  }, [fetchBusinesses]);

  return { businesses, loading, error, createBusiness, updateBusiness, refreshQrToken, refetch: fetchBusinesses };
}
