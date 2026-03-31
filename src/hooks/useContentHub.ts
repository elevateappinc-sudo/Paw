'use client';
import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ContentHubRequest, ContentHubResponse, ContentGeneration } from '@/types/content-hub';

export function useContentHub(petId?: string) {
  const [result, setResult] = useState<ContentHubResponse | null>(null);
  const [history, setHistory] = useState<ContentGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyRemaining, setDailyRemaining] = useState(30);

  useEffect(() => {
    if (!petId) return;
    const supabase = createClient();
    supabase.from('content_generations').select('*').eq('pet_id', petId).order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => setHistory((data ?? []) as ContentGeneration[]));
  }, [petId]);

  const generate = useCallback(async (params: ContentHubRequest) => {
    setIsLoading(true); setError(null);
    try {
      const res = await fetch('/api/content-hub', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Error al generar. Intenta de nuevo.'); return; }
      setResult(data);
      setDailyRemaining(data.dailyRemaining ?? 30);
      // Refresh history
      const supabase = createClient();
      const { data: hist } = await supabase.from('content_generations').select('*').eq('pet_id', params.petId).order('created_at', { ascending: false }).limit(30);
      setHistory((hist ?? []) as ContentGeneration[]);
    } catch { setError('Error de conexión. Intenta de nuevo.'); }
    finally { setIsLoading(false); }
  }, []);

  const deleteHistoryItem = useCallback(async (id: string) => {
    const supabase = createClient();
    await supabase.from('content_generations').delete().eq('id', id);
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
  }, []);

  return { result, history, isLoading, error, dailyRemaining, generate, deleteHistoryItem, copyToClipboard, setResult };
}
