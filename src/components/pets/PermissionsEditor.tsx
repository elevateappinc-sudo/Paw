"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, SegmentedControl, SkeletonRow, showToast } from "@/components/ui";

type AccessLevel = "none" | "view" | "edit";

interface Permission {
  id: string;
  pet_member_id: string;
  module: string;
  access_level: AccessLevel;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard: "Inicio",
  gastos: "Gastos",
  entrenamiento: "Entrenamiento",
  vacunas: "Vacunas",
  itinerario: "Rutina diaria",
  notificaciones: "Avisos",
  medicamentos: "Medicamentos",
  info: "Información",
};

const LEVELS: { value: AccessLevel; label: string }[] = [
  { value: "none", label: "Sin acceso" },
  { value: "view", label: "Ver" },
  { value: "edit", label: "Editar" },
];

interface Props {
  petMemberId: string;
  onClose: () => void;
}

/** Editor de permisos por módulo para una persona con acceso. */
export default function PermissionsEditor({ petMemberId, onClose }: Props) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    void loadPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petMemberId]);

  async function loadPermissions() {
    const supabase = createClient();
    const { data } = await supabase.from("pet_member_permissions").select("*").eq("pet_member_id", petMemberId);
    setPermissions((data ?? []) as Permission[]);
    setLoading(false);
  }

  async function updatePermission(module: string, level: AccessLevel) {
    setSaving(module);
    const supabase = createClient();
    const existing = permissions.find((p) => p.module === module);
    try {
      if (existing) {
        const { error } = await supabase.from("pet_member_permissions").update({ access_level: level }).eq("id", existing.id);
        if (error) throw error;
        setPermissions((prev) => prev.map((p) => (p.module === module ? { ...p, access_level: level } : p)));
      } else {
        const { data, error } = await supabase.from("pet_member_permissions").insert({ pet_member_id: petMemberId, module, access_level: level }).select().single();
        if (error) throw error;
        if (data) setPermissions((prev) => [...prev, data as Permission]);
      }
    } catch {
      showToast("No se pudo guardar el permiso", () => void updatePermission(module, level), "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Permisos de acceso">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-subtitle leading-tight text-text">Permisos de acceso</h3>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Listo
        </Button>
      </div>
      {loading ? (
        <Card padded={false} className="overflow-hidden" aria-busy="true">
          <SkeletonRow trailing={false} />
          <SkeletonRow trailing={false} />
          <SkeletonRow trailing={false} />
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(MODULE_LABELS).map(([module, label]) => {
            const perm = permissions.find((p) => p.module === module);
            const currentLevel = perm?.access_level ?? "none";
            const isSaving = saving === module;
            return (
              <Card key={module} tone="container" elevation={0} className="flex flex-col gap-2 p-3" aria-busy={isSaving || undefined}>
                <p className="text-body font-semibold text-text">{label}</p>
                <SegmentedControl<AccessLevel>
                  ariaLabel={`Acceso a ${label}`}
                  size="sm"
                  value={currentLevel}
                  onChange={(lvl) => {
                    if (lvl !== currentLevel && !isSaving) void updatePermission(module, lvl);
                  }}
                  options={LEVELS}
                />
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
