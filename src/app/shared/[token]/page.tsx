import type { Metadata } from "next";
import { Clock, Lock } from "lucide-react";
import { PetHealth } from "@/components/icons/pet";
import { createClient } from "@/lib/supabase/server";
import { Card, Divider, EmptyState, Tag } from "@/components/ui";
import type { ClinicalRecord } from "@/types";

export const metadata: Metadata = { title: "Historial compartido" };

const VISIT_TYPE_LABELS: Record<string, string> = {
  consulta_general: "Consulta general",
  emergencia: "Emergencia",
  cirugia: "Cirugía",
  control_rutina: "Control de rutina",
  peluqueria: "Peluquería",
  otro: "Otro",
};

function formatDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

function Unavailable({ icon, description }: { icon: React.ReactNode; description: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5">
      <EmptyState tone="neutral" icon={icon} title="Este historial ya no está disponible" description={description} />
    </main>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <p className="mt-2 text-body text-text">
      <span className="mr-1 text-label font-semibold text-text-secondary">{label}</span>
      {value}
    </p>
  );
}

export default async function SharedHistorialPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: tokenData, error: tokenError } = await supabase.from("share_tokens").select("*").eq("token", token).single();

  if (tokenError || !tokenData) {
    return <Unavailable icon={<Lock size={24} />} description="El enlace expiró o no es válido." />;
  }

  const expiresAt = new Date(tokenData.expires_at as string);
  if (expiresAt < new Date()) {
    return <Unavailable icon={<Clock size={24} />} description="El enlace de 24 horas ha expirado." />;
  }

  const { data: pet } = await supabase.from("pets").select("name, emoji, color").eq("id", tokenData.pet_id as string).single();
  const { data: records } = await supabase.from("clinical_records").select("*").eq("pet_id", tokenData.pet_id as string).order("visit_date", { ascending: false });

  const petName = (pet as { name: string } | null)?.name ?? "Mascota";
  const list = (records ?? []) as ClinicalRecord[];

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[640px] bg-bg pb-10">
      <header className="px-4 pt-[max(24px,env(safe-area-inset-top))] pb-4">
        <div className="text-small font-semibold text-text-secondary">{petName}</div>
        <h1 className="font-semibold text-display leading-[1.1] text-text">Historial clínico</h1>
        <Tag className="mt-2" tone="info" size="xs">
          Solo lectura · compartido
        </Tag>
      </header>

      <div className="px-4">
        {list.length === 0 ? (
          <Card>
            <EmptyState compact tone="neutral" icon={<PetHealth size={24} />} title="Sin registros clínicos" />
          </Card>
        ) : (
          <Card padded={false} className="overflow-hidden">
            {list.map((r, i) => (
              <article key={r.id}>
                {i > 0 && <Divider className="ml-[72px] mr-0" />}
                <div className="flex items-start gap-3 px-4 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
                    <PetHealth size={20} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-subtitle font-semibold text-text">{VISIT_TYPE_LABELS[r.visit_type] ?? r.visit_type}</h2>
                    <p className="text-small text-text-secondary">
                      {formatDate(r.visit_date)}
                      {r.vet_name && ` · ${r.vet_name}`}
                      {r.clinic_name && ` · ${r.clinic_name}`}
                    </p>
                    {r.diagnosis && <Field label="Diagnóstico" value={r.diagnosis} />}
                    {r.treatment && <Field label="Tratamiento" value={r.treatment} />}
                    {r.notes && <Field label="Notas" value={r.notes} />}
                  </div>
                </div>
              </article>
            ))}
          </Card>
        )}
      </div>
    </main>
  );
}
