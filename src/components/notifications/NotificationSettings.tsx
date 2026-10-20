"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Calendar, Wallet, type LucideIcon } from "lucide-react";
import { PetMedication, PetTraining, PetVaccine } from "@/components/icons/pet";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button, Card, Divider, Row, SectionTitle, SkeletonRow, Toggle, showToast } from "@/components/ui";

type Category = "medications" | "itinerary" | "training" | "expenses" | "vaccines";

const CATEGORY_LABELS: Record<Category, { label: string; icon: LucideIcon }> = {
  medications: { label: "Medicamentos", icon: PetMedication },
  itinerary: { label: "Rutina diaria", icon: Calendar },
  training: { label: "Entrenamiento", icon: PetTraining },
  expenses: { label: "Gastos", icon: Wallet },
  vaccines: { label: "Vacunas", icon: PetVaccine },
};

const ALL_CATEGORIES: Category[] = ["medications", "itinerary", "training", "expenses", "vaccines"];

interface Preferences {
  [key: string]: boolean;
}

/** Ajustes de notificaciones push: permiso del navegador y categorías. */
export function NotificationSettings({ showTitle = true }: { showTitle?: boolean }) {
  const { user } = useAuthContext();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [prefs, setPrefs] = useState<Preferences>({});
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase.from("notification_preferences").select("category, enabled").eq("user_id", user.id);

    const map: Preferences = {};
    ALL_CATEGORIES.forEach((cat) => {
      map[cat] = true;
    });
    data?.forEach((row: { category: string; enabled: boolean }) => {
      map[row.category] = row.enabled;
    });
    setPrefs(map);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);

  async function toggleCategory(category: Category, newVal: boolean) {
    if (!user) return;
    const prev = prefs[category];
    setPrefs((p) => ({ ...p, [category]: newVal }));
    const supabase = createClient();
    const { error } = await supabase.from("notification_preferences").upsert({ user_id: user.id, category, enabled: newVal }, { onConflict: "user_id,category" });
    if (error) {
      setPrefs((p) => ({ ...p, [category]: prev }));
      showToast("No se pudo guardar la preferencia", () => void toggleCategory(category, newVal), "error");
    }
  }

  async function handleEnableNotifications() {
    setRequesting(true);
    await requestPermission();
    setRequesting(false);
  }

  return (
    <section className="flex flex-col gap-3" aria-label="Notificaciones">
      {showTitle && <SectionTitle>Notificaciones</SectionTitle>}

      {isSupported && permission !== "granted" && (
        <Card tone="primary" elevation={0} padded={false}>
          <Row
            icon={<Bell size={20} aria-hidden="true" />}
            iconTone="primary"
            title="Activar recordatorios"
            subtitle="Alertas de medicamentos, vacunas y más"
            trailing={
              <Button size="sm" onClick={() => void handleEnableNotifications()} loading={requesting} disabled={permission === "denied"}>
                {permission === "denied" ? "Bloqueado" : "Activar"}
              </Button>
            }
          />
          {permission === "denied" && <p className="px-4 pb-3 text-label text-primary-text">Permiso bloqueado: actívalo desde los ajustes del navegador.</p>}
        </Card>
      )}

      {!isSupported && (
        <Card tone="container" elevation={0} padded={false}>
          <Row icon={<BellOff size={20} aria-hidden="true" />} title="Sin notificaciones push" subtitle="Tu dispositivo o navegador no las admite" />
        </Card>
      )}

      <Card padded={false} className="overflow-hidden">
        {loading
          ? ALL_CATEGORIES.map((cat) => <SkeletonRow key={cat} />)
          : ALL_CATEGORIES.map((cat, idx) => {
              const { label, icon: Icon } = CATEGORY_LABELS[cat];
              const enabled = prefs[cat] ?? true;
              return (
                <div key={cat}>
                  {idx > 0 && <Divider className="ml-18 mr-0" />}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-text-secondary">
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <Toggle label={label} checked={enabled} onChange={(v) => void toggleCategory(cat, v)} />
                    </div>
                  </div>
                </div>
              );
            })}
      </Card>
    </section>
  );
}
