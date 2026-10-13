"use client";
import { useState } from "react";
import { Eye, MapPin } from "lucide-react";
import { Button, Sheet, Textarea, showToast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { reportSighting } from "@/lib/api/lostPets";
import { useGeolocation } from "@/hooks/useGeolocation";

/**
 * "Vi a esta mascota": inserta en lost_pet_sightings. Si no hay sesión,
 * la política RLS lo rechaza y ofrecemos llamar al dueño.
 */
export function SightingForm({ alertId, contactPhone }: { alertId: string; contactPhone: string | null }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const geo = useGeolocation(false);

  async function submit() {
    setSending(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      await reportSighting(alertId, {
        user_id: data.user?.id,
        lat: geo.lat ?? undefined,
        lng: geo.lng ?? undefined,
        message: message.trim() || undefined,
      });
      setDone(true);
      setOpen(false);
      showToast("Gracias, avisamos al dueño", undefined, "success");
    } catch {
      showToast(contactPhone ? "No pudimos registrar el aviso. Llama al dueño directamente." : "No pudimos registrar el aviso. Inicia sesión en Paw para reportar.", undefined, "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button variant="secondary" size="lg" full leading={<Eye size={20} aria-hidden="true" />} onClick={() => setOpen(true)} disabled={done}>
        {done ? "Aviso enviado" : "Vi a esta mascota"}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="¿Dónde la viste?"
        subtitle="Tu ubicación aproximada ayuda a encontrarla"
        footer={
          <Button full size="lg" onClick={submit} loading={sending}>
            Enviar aviso
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <Button
            variant={geo.lat !== null ? "tonal" : "outline"}
            leading={<MapPin size={18} aria-hidden="true" />}
            onClick={geo.request}
            loading={geo.status === "loading"}
          >
            {geo.lat !== null ? "Ubicación lista" : geo.status === "denied" ? "Ubicación no permitida" : "Usar mi ubicación"}
          </Button>
          <Textarea label="Mensaje" placeholder="Ej.: la vi en el parque junto a la panadería, hace 10 minutos" value={message} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </Sheet>
    </>
  );
}
