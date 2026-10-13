"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button, Card, EmptyState, Input, Row, Select, Sheet, SkeletonRow, Tag, Textarea, showToast } from "@/components/ui";
import { deleteService, fetchBusinessServices, upsertService } from "@/lib/api/businesses";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { formatCurrency } from "@/lib/utils";
import { CARE_KIND_LABEL, type Business, type BusinessService, type CareCycleKind } from "@/types/db";

interface Draft {
  id?: string;
  name: string;
  description: string;
  price: string;
  duration_min: string;
  care_cycle_kind: CareCycleKind | "";
  care_cycle_name: string;
}

const EMPTY: Draft = { name: "", description: "", price: "", duration_min: "30", care_cycle_kind: "", care_cycle_name: "" };
const KIND_OPTIONS = (Object.keys(CARE_KIND_LABEL) as CareCycleKind[]).map((value) => ({ value, label: CARE_KIND_LABEL[value] }));

export function ServiciosTab({ business }: { business: Business }) {
  const [services, setServices] = useState<BusinessService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | undefined>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setServices(await fetchBusinessServices(business.id));
    } catch (e) {
      if (isMissingSchema(e)) setServices([]);
      else setError("No pudimos cargar los servicios");
    } finally {
      setLoading(false);
    }
  }, [business.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function edit(s: BusinessService) {
    setDraft({ id: s.id, name: s.name, description: s.description ?? "", price: s.price !== null ? String(s.price) : "", duration_min: s.duration_min !== null ? String(s.duration_min) : "", care_cycle_kind: s.care_cycle_kind ?? "", care_cycle_name: s.care_cycle_name ?? "" });
    setNameError(undefined);
  }

  async function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setNameError("Ponle un nombre al servicio");
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertService({
        ...(draft.id ? { id: draft.id } : {}),
        business_id: business.id,
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        price: draft.price.trim() ? Number(draft.price) : null,
        duration_min: draft.duration_min.trim() ? Number(draft.duration_min) : null,
        care_cycle_kind: draft.care_cycle_kind || null,
        care_cycle_name: draft.care_cycle_name.trim() || null,
        active: true,
      });
      setServices((rows) => (draft.id ? rows.map((r) => (r.id === saved.id ? saved : r)) : [...rows, saved]));
      setDraft(null);
      showToast("Servicio guardado", undefined, "success");
    } catch {
      showToast("No pudimos guardar el servicio", () => void save(), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: BusinessService) {
    const prev = services;
    setServices((rows) => rows.filter((r) => r.id !== s.id));
    setDraft(null);
    try {
      await deleteService(s.id);
      showToast("Servicio eliminado");
    } catch {
      setServices(prev);
      showToast("No pudimos eliminar el servicio", undefined, "error");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button variant="tonal" full leading={<Plus size={18} aria-hidden="true" />} onClick={() => { setDraft({ ...EMPTY }); setNameError(undefined); }}>
        Nuevo servicio
      </Button>

      {loading ? (
        <Card padded={false}>
          <SkeletonRow />
          <SkeletonRow />
        </Card>
      ) : error ? (
        <EmptyState tone="danger" compact title="Algo salió mal" description={error} action={<Button full onClick={load}>Reintentar</Button>} />
      ) : services.length === 0 ? (
        <EmptyState compact title="Aún no tienes servicios" description="Crea el primero: baño, vacuna, consulta… Con un ciclo asociado, la cita completa el cuidado de la mascota." />
      ) : (
        <Card padded={false} className="divide-y divide-outline-variant">
          {services.map((s) => (
            <Row
              key={s.id}
              icon={<Clock size={20} aria-hidden="true" />}
              title={s.name}
              subtitle={[s.price !== null ? formatCurrency(Number(s.price)) : "Sin precio", s.duration_min ? `${s.duration_min} min` : null].filter(Boolean).join(" · ")}
              trailing={s.care_cycle_kind ? <Tag tone="primary" size="xs">{CARE_KIND_LABEL[s.care_cycle_kind]}</Tag> : undefined}
              onClick={() => edit(s)}
            />
          ))}
        </Card>
      )}

      <Sheet
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Editar servicio" : "Nuevo servicio"}
        footer={
          <div className="flex gap-2">
            {draft?.id && (
              <Button variant="dangerTonal" size="icon" aria-label="Eliminar servicio" onClick={() => { const s = services.find((x) => x.id === draft.id); if (s) void remove(s); }}>
                <Trash2 size={18} />
              </Button>
            )}
            <Button full size="lg" onClick={save} loading={saving}>Guardar</Button>
          </div>
        }
      >
        {draft && (
          <div className="flex flex-col gap-3">
            <Input label="Nombre" placeholder="Ej.: Baño y secado" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={nameError} />
            <Textarea label="Descripción" placeholder="Qué incluye" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Precio (COP)" inputMode="numeric" type="number" placeholder="60000" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
              <Input label="Duración (min)" inputMode="numeric" type="number" placeholder="30" value={draft.duration_min} onChange={(e) => setDraft({ ...draft, duration_min: e.target.value })} />
            </div>
            <Select label="Ciclo que completa" options={KIND_OPTIONS} placeholder="Ninguno" value={draft.care_cycle_kind} onChange={(e) => setDraft({ ...draft, care_cycle_kind: e.target.value as CareCycleKind | "" })} hint="Al completar la cita, se registra este cuidado en la mascota" />
            {draft.care_cycle_kind && (
              <Input label="Nombre del ciclo (opcional)" placeholder="Ej.: Antirrábica" value={draft.care_cycle_name} onChange={(e) => setDraft({ ...draft, care_cycle_name: e.target.value })} />
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
}
