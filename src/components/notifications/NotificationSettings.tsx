"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const ACCENT = "#FF7A45";

type Category = "medications" | "itinerary" | "training" | "expenses" | "vaccines";

const CATEGORY_LABELS: Record<Category, { label: string; emoji: string }> = {
  medications: { label: "Medicamentos",   emoji: "💊" },
  itinerary:   { label: "Itinerario",     emoji: "📅" },
  training:    { label: "Entrenamiento",  emoji: "🏃" },
  expenses:    { label: "Gastos",         emoji: "💰" },
  vaccines:    { label: "Vacunas",        emoji: "💉" },
};

const ALL_CATEGORIES: Category[] = ["medications", "itinerary", "training", "expenses", "vaccines"];

interface Preferences {
  [key: string]: boolean;
}

export function NotificationSettings() {
  const { user } = useAuthContext();
  const { isSupported, permission, requestPermission } = usePushNotifications();
  const [prefs, setPrefs] = useState<Preferences>({});
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const loadPrefs = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("notification_preferences")
      .select("category, enabled")
      .eq("user_id", user.id);

    const map: Preferences = {};
    ALL_CATEGORIES.forEach((cat) => { map[cat] = true; }); // default: all on
    data?.forEach((row: { category: string; enabled: boolean }) => {
      map[row.category] = row.enabled;
    });
    setPrefs(map);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  async function toggleCategory(category: Category) {
    if (!user) return;
    const newVal = !prefs[category];
    setPrefs((p) => ({ ...p, [category]: newVal }));

    const supabase = createClient();
    await supabase.from("notification_preferences").upsert(
      { user_id: user.id, category, enabled: newVal },
      { onConflict: "user_id,category" }
    );
  }

  async function handleEnableNotifications() {
    setRequesting(true);
    await requestPermission();
    setRequesting(false);
  }

  const sep = <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />;

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Section header */}
      <div style={{ padding: "24px 20px 12px" }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "rgba(235,235,245,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Notificaciones
        </h3>
      </div>

      {/* Permission card */}
      {isSupported && permission !== "granted" && (
        <div style={{ margin: "0 20px 16px", background: "#1c1c1e", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <Bell size={20} color={ACCENT} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>
              Activar recordatorios
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(235,235,245,0.5)" }}>
              Recibe alertas de medicamentos, vacunas y más
            </p>
          </div>
          <button
            onClick={handleEnableNotifications}
            disabled={requesting || permission === "denied"}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              background: permission === "denied" ? "rgba(255,255,255,0.1)" : ACCENT,
              border: "none",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: permission === "denied" ? "not-allowed" : "pointer",
              opacity: requesting ? 0.7 : 1,
            }}
          >
            {permission === "denied" ? "Bloqueado" : requesting ? "..." : "Activar"}
          </button>
        </div>
      )}

      {!isSupported && (
        <div style={{ margin: "0 20px 16px", background: "#1c1c1e", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <BellOff size={20} color="rgba(235,235,245,0.3)" />
          <p style={{ margin: 0, fontSize: 14, color: "rgba(235,235,245,0.5)" }}>
            Tu dispositivo no soporta push notifications
          </p>
        </div>
      )}

      {/* Category toggles */}
      <div style={{ background: "#1c1c1e", borderRadius: 12, margin: "0 20px", overflow: "hidden" }}>
        {!loading && ALL_CATEGORIES.map((cat, idx) => {
          const { label, emoji } = CATEGORY_LABELS[cat];
          const enabled = prefs[cat] ?? true;

          return (
            <div key={cat}>
              <div
                style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 12 }}
              >
                <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{emoji}</span>
                <span style={{ flex: 1, fontSize: 16, color: "#fff" }}>{label}</span>
                {/* iOS-style toggle */}
                <button
                  onClick={() => toggleCategory(cat)}
                  aria-label={`${enabled ? "Desactivar" : "Activar"} ${label}`}
                  style={{
                    width: 51,
                    height: 31,
                    borderRadius: 999,
                    background: enabled ? ACCENT : "rgba(120,120,128,0.32)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute",
                    top: 2,
                    left: enabled ? 22 : 2,
                    width: 27,
                    height: 27,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    transition: "left 0.2s",
                    display: "block",
                  }} />
                </button>
              </div>
              {idx < ALL_CATEGORIES.length - 1 && sep}
            </div>
          );
        })}

        {loading && (
          <div style={{ padding: 20, textAlign: "center", color: "rgba(235,235,245,0.3)", fontSize: 14 }}>
            Cargando...
          </div>
        )}
      </div>
    </div>
  );
}
