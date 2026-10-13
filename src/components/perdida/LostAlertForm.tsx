"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, PawPrint } from "lucide-react";
import { Button, Card, Chip, ChipRow, Input, PageHeader, Textarea, showToast } from "@/components/ui";
import { PetAvatar } from "@/components/pets/PetAvatar";
import { useActivePet } from "@/hooks/useActivePet";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAuthContext } from "@/contexts/AuthContext";
import { createLostAlert } from "@/lib/api/lostPets";
import { fetchPet } from "@/lib/api/pets";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { PetPicker } from "@/components/sos/PetPicker";
import { RADIUS_OPTIONS } from "./lostData";

export function LostAlertForm() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { pet, pets, selectPet } = useActivePet();
  const geo = useGeolocation(false);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [radius, setRadius] = useState(3000);
  const [reward, setReward] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string; place?: string }>({});

  useEffect(() => {
    if (!pet) return;
    let cancelled = false;
    fetchPet(pet.id)
      .then((row) => {
        if (cancelled || !row) return;
        setPhotoUrl(row.photo_url);
        setPhone((prev) => prev || row.emergency_contact?.phone || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pet]);

  async function submit() {
    if (!pet || !user) return;
    const next: typeof errors = {};
    if (!phone.trim()) next.phone = "Necesitamos un teléfono para que te avisen";
    if (geo.lat === null && !address.trim()) next.place = "Indica el último lugar o usa tu ubicación";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const alert = await createLostAlert({
        pet_id: pet.id,
        user_id: user.id,
        lat: geo.lat ?? undefined,
        lng: geo.lng ?? undefined,
        address: address.trim() || undefined,
        message: message.trim() || undefined,
        contact_phone: phone.trim(),
        photo_url: photoUrl ?? undefined,
        radius_m: radius,
        reward: reward ? Number(reward) : undefined,
      });
      router.replace(`/perdida/${alert.id}`);
    } catch (e) {
      showToast(isMissingSchema(e) ? "Las alertas aún no están disponibles en tu cuenta" : "No pudimos crear la alerta", () => void submit(), "error");
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader title="Reportar perdida" eyebrow="Avisaremos a la comunidad cerca" back />
      <div className="flex flex-col gap-4 px-4">
        {pet ? (
          <Card>
            <div className="flex items-center gap-3">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt={pet.name} className="h-16 w-16 shrink-0 rounded-card object-cover" />
              ) : (
                <PetAvatar pet={pet} size="md" style={{ width: 64, height: 64, borderRadius: 16 }} />
              )}
              <div className="min-w-0">
                <div className="font-display text-[18px] leading-tight text-on">{pet.name}</div>
                <div className="text-[13px] text-on-variant">{pet.breed ?? "Sin raza registrada"} · usaremos su foto de perfil</div>
              </div>
            </div>
            <PetPicker pets={pets} activeId={pet.id} onSelect={selectPet} />
          </Card>
        ) : (
          <Card tone="container">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-surface text-on-variant"><PawPrint size={22} aria-hidden="true" /></span>
              <div className="text-[15px] font-bold text-on">Primero agrega una mascota en Paw</div>
            </div>
          </Card>
        )}

        <Card>
          <div className="text-[13px] font-semibold text-on-variant">Último lugar donde la viste</div>
          <Button variant={geo.lat !== null ? "tonal" : "outline"} className="mt-2" full leading={<MapPin size={18} aria-hidden="true" />} onClick={geo.request} loading={geo.status === "loading"}>
            {geo.lat !== null ? "Ubicación guardada" : geo.status === "denied" ? "Ubicación no permitida · escribe la dirección" : "Usar mi ubicación"}
          </Button>
          <Input className="mt-3" label="Dirección o referencia" placeholder="Ej.: Parque de la 93, entrada norte" value={address} onChange={(e) => setAddress(e.target.value)} error={errors.place} />
        </Card>

        <Card>
          <Textarea label="Mensaje para quien la vea" placeholder="Ej.: responde a su nombre, lleva collar azul, es tímida" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Input className="mt-3" label="Teléfono de contacto" type="tel" inputMode="tel" placeholder="300 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
          <div className="mt-3 text-[13px] font-semibold text-on-variant">Radio de aviso</div>
          <ChipRow className="mt-1.5">
            {RADIUS_OPTIONS.map((o) => (
              <Chip key={o.value} selected={radius === o.value} onClick={() => setRadius(o.value)}>
                {o.label}
              </Chip>
            ))}
          </ChipRow>
          <Input className="mt-3" label="Recompensa (opcional)" type="number" inputMode="numeric" placeholder="0" value={reward} onChange={(e) => setReward(e.target.value)} leading={<span className="text-[15px] font-bold">$</span>} />
        </Card>

        <Button size="lg" full variant="danger" onClick={submit} loading={saving} disabled={!pet || !user}>
          Publicar alerta
        </Button>
        <p className="px-2 text-center text-[13px] text-on-variant">Los usuarios de Paw en el radio elegido recibirán el aviso con la foto y tu teléfono.</p>
      </div>
    </div>
  );
}
