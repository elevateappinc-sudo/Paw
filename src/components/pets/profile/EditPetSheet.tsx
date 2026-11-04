"use client";
import { useEffect, useState } from "react";
import { Sheet, Input, Select, Toggle, SegmentedControl, Button, showToast } from "@/components/ui";
import { updatePetProfile, SPECIES_LABEL } from "@/lib/api/pets";
import { useStore } from "@/store";
import { ChipsInput } from "@/components/pets/ChipsInput";
import { uploadPetProfilePhoto } from "@/components/pets/petPhoto";
import { PhotoDropCircle } from "@/components/pets/PhotoDropCircle";
import { today } from "@/lib/utils";
import type { ActivityLevel, PetRow, Sex, Species } from "@/types/db";

interface Form {
  name: string;
  species: Species;
  breed: string;
  birth_date: string;
  sex: Sex;
  neutered: boolean;
  microchip: string;
  allergies: string[];
  conditions: string[];
  blood_type: string;
  ec_name: string;
  ec_phone: string;
  activity_level: ActivityLevel;
}

function fromRow(p: PetRow): Form {
  return {
    name: p.name,
    species: p.species,
    breed: p.breed ?? "",
    birth_date: p.birth_date ?? "",
    sex: p.sex ?? "unknown",
    neutered: !!p.neutered,
    microchip: p.microchip ?? "",
    allergies: p.allergies ?? [],
    conditions: p.conditions ?? [],
    blood_type: p.blood_type ?? "",
    ec_name: p.emergency_contact?.name ?? "",
    ec_phone: p.emergency_contact?.phone ?? "",
    activity_level: p.activity_level ?? "medium",
  };
}

export function EditPetSheet({ open, onClose, pet, userId, onSaved }: { open: boolean; onClose: () => void; pet: PetRow; userId: string; onSaved: (row: PetRow) => void }) {
  const updatePet = useStore((s) => s.updatePet);
  const [form, setForm] = useState<Form>(() => fromRow(pet));
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(fromRow(pet));
      setNameError(null);
      setPhotoFile(null);
      setPreview(null);
    }
  }, [open, pet]);

  useEffect(() => {
    if (!photoFile) return;
    const url = URL.createObjectURL(photoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) {
      setNameError("Ponle un nombre");
      return;
    }
    setSaving(true);
    try {
      let photo_url: string | undefined;
      if (photoFile) {
        try {
          photo_url = await uploadPetProfilePhoto(photoFile, pet.id, userId);
        } catch {
          showToast("No pudimos subir la foto; guardamos el resto", undefined, "error");
        }
      }
      const row = await updatePetProfile(pet.id, {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed.trim() || null,
        birth_date: form.birth_date || null,
        sex: form.sex,
        neutered: form.neutered,
        microchip: form.microchip.trim() || null,
        allergies: form.allergies,
        conditions: form.conditions,
        blood_type: form.blood_type.trim() || null,
        emergency_contact: form.ec_name.trim() || form.ec_phone.trim() ? { name: form.ec_name.trim(), phone: form.ec_phone.trim() } : null,
        activity_level: form.activity_level,
        ...(photo_url ? { photo_url } : {}),
      });
      void updatePet(pet.id, { name: row.name, breed: row.breed ?? "", birthDate: row.birth_date ?? "", species: row.species });
      onSaved(row);
      showToast("Perfil actualizado", undefined, "success");
      onClose();
    } catch {
      showToast("No se pudo guardar", () => void save(), "error");
    } finally {
      setSaving(false);
    }
  }

  const currentPhoto = preview ?? pet.photo_url;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Editar a ${pet.name}`}
      footer={
        <Button full size="lg" onClick={() => void save()} loading={saving}>
          Guardar cambios
        </Button>
      }
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="flex items-center gap-4">
          <PhotoDropCircle preview={currentPhoto} onFile={setPhotoFile} label="Cambiar foto" />
          <div className="text-small text-text-secondary">Toca el círculo o arrastra una foto aquí. Sin texto encima, solo la mascota.</div>
        </div>
        <Input
          label="Nombre"
          value={form.name}
          error={nameError ?? undefined}
          onChange={(e) => {
            set("name", e.target.value);
            if (nameError && e.target.value.trim()) setNameError(null);
          }}
        />
        <Select label="Especie" value={form.species} onChange={(e) => set("species", e.target.value as Species)} options={Object.entries(SPECIES_LABEL).map(([value, label]) => ({ value, label }))} />
        <Input label="Raza" value={form.breed} onChange={(e) => set("breed", e.target.value)} placeholder="Criollo, labrador, siamés…" />
        <Input label="Nacimiento" type="date" value={form.birth_date} max={today()} onChange={(e) => set("birth_date", e.target.value)} />
        <div className="flex flex-col gap-2">
          <span className="text-small font-semibold text-text-secondary">Sexo</span>
          <SegmentedControl
            ariaLabel="Sexo"
            value={form.sex}
            onChange={(v) => set("sex", v)}
            options={[
              { value: "male", label: "Macho" },
              { value: "female", label: "Hembra" },
              { value: "unknown", label: "No sé" },
            ]}
          />
        </div>
        <Toggle label="Esterilizado" checked={form.neutered} onChange={(v) => set("neutered", v)} />
        <Input label="Microchip" value={form.microchip} onChange={(e) => set("microchip", e.target.value)} placeholder="Número de 15 dígitos" inputMode="numeric" />
        <ChipsInput label="Alergias" tone="warn" value={form.allergies} onChange={(v) => set("allergies", v)} placeholder="Pollo, polen…" />
        <ChipsInput label="Condiciones" value={form.conditions} onChange={(v) => set("conditions", v)} placeholder="Displasia, diabetes…" />
        <Input label="Grupo sanguíneo" value={form.blood_type} onChange={(e) => set("blood_type", e.target.value)} placeholder="DEA 1.1+, A…" />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Contacto de emergencia" value={form.ec_name} onChange={(e) => set("ec_name", e.target.value)} placeholder="Nombre" />
          <Input label="Teléfono" type="tel" value={form.ec_phone} onChange={(e) => set("ec_phone", e.target.value)} placeholder="300 000 0000" />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-small font-semibold text-text-secondary">Nivel de actividad</span>
          <SegmentedControl
            ariaLabel="Nivel de actividad"
            value={form.activity_level}
            onChange={(v) => set("activity_level", v)}
            options={[
              { value: "low", label: "Tranquilo" },
              { value: "medium", label: "Normal" },
              { value: "high", label: "Muy activo" },
            ]}
          />
        </div>
      </div>
    </Sheet>
  );
}
