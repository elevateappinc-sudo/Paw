import { createClient } from "@/lib/supabase/client";
import type { ClinicalRecord, VisitType } from "@/types";
import type { MedicationData, MedicationLogData } from "@/components/medications/MedicationCard";

export type { MedicationData, MedicationLogData };

export async function fetchMedications(petId: string): Promise<MedicationData[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("pet_id", petId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MedicationData[];
}

/** Tomas administradas (para el historial) */
export async function fetchAdministeredLogs(petId: string, limit = 60): Promise<MedicationLogData[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("medication_logs")
    .select("*")
    .eq("pet_id", petId)
    .eq("status", "administered")
    .order("administered_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MedicationLogData[];
}

export async function fetchClinicalRecords(petId: string, limit = 100): Promise<ClinicalRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinical_records")
    .select("*")
    .eq("pet_id", petId)
    .order("visit_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ClinicalRecord[];
}

export async function createClinicalRecord(input: {
  pet_id: string;
  user_id: string;
  visit_date: string;
  visit_type: VisitType;
  vet_name?: string;
  clinic_name?: string;
  diagnosis?: string;
  notes?: string;
}): Promise<ClinicalRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinical_records")
    .insert({
      pet_id: input.pet_id,
      user_id: input.user_id,
      visit_date: input.visit_date,
      visit_type: input.visit_type,
      vet_name: input.vet_name || null,
      clinic_name: input.clinic_name || null,
      diagnosis: input.diagnosis || null,
      notes: input.notes || null,
      created_by_role: "owner",
    })
    .select()
    .single();
  if (error) throw error;
  return data as ClinicalRecord;
}

/** Nombres de negocios por id (en lote) */
export async function fetchBusinessNames(ids: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return {};
  const supabase = createClient();
  const { data, error } = await supabase.from("businesses").select("id, name").in("id", unique);
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const row of (data ?? []) as { id: string; name: string }[]) map[row.id] = row.name;
  return map;
}
