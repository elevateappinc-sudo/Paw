"use client";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Button, Sheet, Textarea, showToast } from "@/components/ui";
import { reportSighting } from "@/lib/api/lostPets";
import { useAuthContext } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isMissingSchema } from "@/lib/api/schemaErrors";

export function SightingSheet({ alertId, petName, onClose, onDone }: { alertId: string | null; petName: string; onClose: () => void; onDone?: () => void }) {
  const { user } = useAuthContext();
  const geo = useGeolocation(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (alertId) setMessage("");
  }, [alertId]);

  async function submit() {
    if (!alertId) return;
    setSending(true);
    try {
      await reportSighting(alertId, { user_id: user?.id, lat: geo.lat ?? undefined, lng: geo.lng ?? undefined, message: message.trim() || undefined });
      showToast(`Gracias, avisamos a la familia de ${petName}`, undefined, "success");
      onDone?.();
      onClose();
    } catch (e) {
      showToast(isMissingSchema(e) ? "Los avistamientos aún no están disponibles" : "No pudimos enviar el aviso", () => void submit(), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet
      open={!!alertId}
      onClose={onClose}
      title={`¿Dónde viste a ${petName}?`}
      subtitle="Tu ubicación aproximada y un mensaje ayudan a encontrarla"
      footer={
        <Button full size="lg" onClick={submit} loading={sending}>
          Enviar aviso
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <Button variant={geo.lat !== null ? "tonal" : "outline"} leading={<MapPin size={18} aria-hidden="true" />} onClick={geo.request} loading={geo.status === "loading"}>
          {geo.lat !== null ? "Ubicación lista" : geo.status === "denied" ? "Ubicación no permitida" : "Usar mi ubicación"}
        </Button>
        <Textarea label="Mensaje" placeholder="Ej.: iba hacia el parque, parecía asustada" value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
    </Sheet>
  );
}
