"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, Building2 } from "lucide-react";
import { Button, Card, Chip, ChipRow, Input, Select, Textarea, Toggle, showToast } from "@/components/ui";
import { upsertBusiness } from "@/lib/api/businesses";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isMissingSchema, errorMessage } from "@/lib/api/schemaErrors";
import { BUSINESS_CATEGORY_LABEL, type Business, type BusinessCategory } from "@/types/db";
import { HoursEditor } from "./HoursEditor";
import { toBusinessPatch, toFormValues, type BusinessFormValues } from "./negocioData";

const CATEGORY_OPTIONS = (Object.keys(BUSINESS_CATEGORY_LABEL) as BusinessCategory[]).map((value) => ({ value, label: BUSINESS_CATEGORY_LABEL[value] }));

export function BusinessForm({ initial, userId, onSaved, mode }: { initial: Business | null; userId: string; onSaved: (b: Business) => void; mode: "create" | "edit" }) {
  const [v, setV] = useState<BusinessFormValues>(() => toFormValues(initial));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const geo = useGeolocation(false);

  const set = <K extends keyof BusinessFormValues>(key: K, value: BusinessFormValues[K]) => setV((s) => ({ ...s, [key]: value }));

  const wantsLocation = useRef(false);

  function useMyLocation() {
    if (geo.lat !== null && geo.lng !== null && geo.status === "ready") {
      set("lat", geo.lat.toFixed(6));
      set("lng", geo.lng.toFixed(6));
      return;
    }
    wantsLocation.current = true;
    geo.request();
  }

  // Cuando llega la posición tras pedirla, la aplicamos una vez
  useEffect(() => {
    if (!wantsLocation.current || geo.status !== "ready" || geo.lat === null || geo.lng === null) return;
    wantsLocation.current = false;
    const lat = geo.lat.toFixed(6);
    const lng = geo.lng.toFixed(6);
    setV((s) => ({ ...s, lat, lng }));
  }, [geo.status, geo.lat, geo.lng]);

  function toggleCategory(c: BusinessCategory) {
    if (c === v.type) return;
    set("categories", v.categories.includes(c) ? v.categories.filter((x) => x !== c) : [...v.categories, c]);
  }

  async function submit() {
    const next: typeof errors = {};
    if (!v.name.trim()) next.name = "El nombre es obligatorio";
    if (!v.phone.trim() && !v.whatsapp.trim()) next.phone = "Deja al menos un teléfono o WhatsApp";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    try {
      const saved = await upsertBusiness(toBusinessPatch(v, userId, initial?.id));
      showToast(mode === "create" ? "Tu negocio ya está en Paw" : "Cambios guardados", undefined, "success");
      onSaved(saved);
    } catch (e) {
      showToast(isMissingSchema(e) ? "El directorio aún no está disponible en tu cuenta" : errorMessage(e, "No pudimos guardar"), () => void submit(), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {mode === "create" && (
        <Card tone="primary" elevation={0}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-surface text-primary"><Building2 size={24} aria-hidden="true" /></span>
            <div>
              <div className="font-display text-[20px] leading-tight">Registra tu negocio en Paw</div>
              <p className="mt-0.5 text-[13px]">Aparece en Explorar, recibe reservas y escribe en el historial de las mascotas.</p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3">
          <Input label="Nombre del negocio" placeholder="Ej.: Veterinaria Los Pinos" value={v.name} onChange={(e) => set("name", e.target.value)} error={errors.name} />
          <Select label="Categoría principal" options={CATEGORY_OPTIONS} value={v.type} onChange={(e) => set("type", e.target.value as BusinessCategory)} />
          <div>
            <div className="text-[13px] font-semibold text-on-variant">Otras categorías</div>
            <ChipRow className="mt-1.5">
              {CATEGORY_OPTIONS.filter((o) => o.value !== v.type).map((o) => (
                <Chip key={o.value} selected={v.categories.includes(o.value)} onClick={() => toggleCategory(o.value)}>
                  {o.label}
                </Chip>
              ))}
            </ChipRow>
          </div>
          <Textarea label="Descripción" placeholder="Qué ofrecen, especialidades, cómo llegar…" value={v.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3">
          <Input label="Dirección" placeholder="Calle 93 # 11-30" value={v.address} onChange={(e) => set("address", e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Barrio" placeholder="Chapinero" value={v.neighborhood} onChange={(e) => set("neighborhood", e.target.value)} />
            <Input label="Ciudad" placeholder="Bogotá" value={v.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Latitud" inputMode="decimal" placeholder="4.6533" value={v.lat} onChange={(e) => set("lat", e.target.value)} />
            <Input label="Longitud" inputMode="decimal" placeholder="-74.0567" value={v.lng} onChange={(e) => set("lng", e.target.value)} />
          </div>
          <Button variant="outline" leading={<MapPin size={18} aria-hidden="true" />} onClick={useMyLocation} loading={geo.status === "loading"}>
            {geo.status === "denied" ? "Ubicación no permitida" : "Usar mi ubicación actual"}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" type="tel" inputMode="tel" placeholder="601 123 4567" value={v.phone} onChange={(e) => set("phone", e.target.value)} error={errors.phone} />
            <Input label="WhatsApp" type="tel" inputMode="tel" placeholder="300 123 4567" value={v.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-2 font-display text-[17px] text-on">Horario semanal</div>
        <Toggle label="Urgencias 24 h" description="Abierto siempre; aparece en la hoja SOS" checked={v.emergency_24h} onChange={(c) => set("emergency_24h", c)} />
        <div className="mt-2">
          <HoursEditor value={v.hours} onChange={(h) => set("hours", h)} disabled={v.emergency_24h} />
        </div>
      </Card>

      <Card>
        <Toggle label="Registra en el historial de las mascotas" description="Al completar una cita, el servicio queda en la ficha de la mascota" checked={v.writes_history} onChange={(c) => set("writes_history", c)} />
      </Card>

      <Button size="lg" full onClick={submit} loading={saving}>
        {mode === "create" ? "Registrar negocio" : "Guardar cambios"}
      </Button>
    </div>
  );
}
