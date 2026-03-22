"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const ACCENT = "#0a84ff";

type AccessLevel = "none" | "view" | "edit";

interface Permission {
  id: string;
  pet_member_id: string;
  module: string;
  access_level: AccessLevel;
}

const MODULE_LABELS: Record<string, string> = {
  dashboard:      "Inicio",
  gastos:         "Gastos",
  entrenamiento:  "Entrenamiento",
  vacunas:        "Vacunas",
  itinerario:     "Horario",
  notificaciones: "Avisos",
  medicamentos:   "Medicamentos",
  info:           "Informaci\u00f3n",
};

const LEVELS: { value: AccessLevel; label: string; color: string }[] = [
  { value: "none", label: "Sin acceso", color: "rgba(255,69,58,0.8)" },
  { value: "view", label: "Ver",        color: ACCENT },
  { value: "edit", label: "Editar",     color: "#34c759" },
];

interface Props {
  petMemberId: string;
  onClose: () => void;
}

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
    const { data } = await supabase
      .from("pet_member_permissions")
      .select("*")
      .eq("pet_member_id", petMemberId);
    setPermissions((data ?? []) as Permission[]);
    setLoading(false);
  }

  async function updatePermission(module: string, level: AccessLevel) {
    setSaving(module);
    const supabase = createClient();
    const existing = permissions.find((p) => p.module === module);
    if (existing) {
      await supabase.from("pet_member_permissions").update({ access_level: level }).eq("id", existing.id);
      setPermissions((prev) => prev.map((p) => p.module === module ? { ...p, access_level: level } : p));
    } else {
      const { data } = await supabase.from("pet_member_permissions").insert({ pet_member_id: petMemberId, module, access_level: level }).select().single();
      if (data) setPermissions((prev) => [...prev, data as Permission]);
    }
    setSaving(null);
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ padding: "20px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>Permisos de acceso</h3>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, padding: "6px 14px", color: "rgba(235,235,245,0.7)", cursor: "pointer", fontSize: 14 }}>
          Listo
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: "rgba(235,235,245,0.4)" }}>Cargando\u2026</div>
      ) : (
        <div style={{ padding: "0 20px 20px" }}>
          {Object.entries(MODULE_LABELS).map(([module, label]) => {
            const perm = permissions.find((p) => p.module === module);
            const currentLevel = perm?.access_level ?? "none";
            return (
              <div key={module} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 8, padding: "14px 16px" }}>
                <p style={{ margin: "0 0 10px", fontSize: 15, color: "#fff", fontWeight: 600 }}>{label}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  {LEVELS.map((lvl) => {
                    const active = currentLevel === lvl.value;
                    const isSaving = saving === module;
                    return (
                      <button key={lvl.value}
                        onClick={() => { if (!active && !isSaving) void updatePermission(module, lvl.value); }}
                        disabled={isSaving}
                        style={{ flex: 1, padding: "8px 4px", borderRadius: 10, border: active ? `1px solid ${lvl.color}44` : "1px solid transparent", background: active ? `${lvl.color}22` : "rgba(255,255,255,0.04)", color: active ? lvl.color : "rgba(235,235,245,0.4)", fontSize: 12, fontWeight: active ? 700 : 400, cursor: isSaving ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.15s" }}>
                        {active && <Check size={11} />}
                        {lvl.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
