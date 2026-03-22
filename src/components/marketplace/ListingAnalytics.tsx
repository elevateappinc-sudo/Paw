"use client";

import { useEffect, useState, useCallback } from "react";
import { getListingAnalytics } from "@/app/actions/marketplace";
import { BarChart2, Eye, MessageCircle, Mail, Lock } from "lucide-react";

interface AnalyticsData {
  id: string;
  title: string;
  listing_analytics: { event_type: string; created_at: string }[];
}

interface ListingAnalyticsProps {
  businessId: string;
  hasAnalytics: boolean;
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "#1a1a1a",
      borderRadius: 12,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "rgba(235,235,245,0.9)" }}>{value}</div>
        <div style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", marginTop: 1 }}>{label}</div>
      </div>
    </div>
  );
}

export function ListingAnalytics({ businessId, hasAnalytics }: ListingAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getListingAnalytics(businessId);
      setData(result as AnalyticsData[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => { void load(); }, [load]);

  // Totals
  const totalViews = data.reduce((acc, l) => acc + l.listing_analytics.filter(e => e.event_type === "view").length, 0);
  const totalWA = data.reduce((acc, l) => acc + l.listing_analytics.filter(e => e.event_type === "click_whatsapp").length, 0);
  const totalEmail = data.reduce((acc, l) => acc + l.listing_analytics.filter(e => e.event_type === "click_email").length, 0);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "rgba(235,235,245,0.3)", fontSize: 14 }}>
        Cargando métricas...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 16px", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(48,209,88,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart2 size={20} color="#30d158" />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(235,235,245,0.95)" }}>Analytics</div>
          <div style={{ fontSize: 12, color: "rgba(235,235,245,0.4)" }}>Rendimiento de tus listados</div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24, filter: hasAnalytics ? undefined : "blur(6px)", pointerEvents: hasAnalytics ? undefined : "none" }}>
        <StatCard icon={<Eye size={16} color="#0a84ff" />} label="Vistas" value={totalViews} color="#0a84ff" />
        <StatCard icon={<MessageCircle size={16} color="#25d366" />} label="WhatsApp" value={totalWA} color="#25d366" />
        <StatCard icon={<Mail size={16} color="#ff9500" />} label="Email" value={totalEmail} color="#ff9500" />
      </div>

      {/* Per-listing breakdown */}
      {data.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, filter: hasAnalytics ? undefined : "blur(6px)", pointerEvents: hasAnalytics ? undefined : "none" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(235,235,245,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Por listado
          </div>
          {data.map((l) => {
            const views = l.listing_analytics.filter(e => e.event_type === "view").length;
            const wa = l.listing_analytics.filter(e => e.event_type === "click_whatsapp").length;
            const email = l.listing_analytics.filter(e => e.event_type === "click_email").length;
            return (
              <div key={l.id} style={{ background: "#111", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(235,235,245,0.8)", marginBottom: 8 }}>{l.title}</div>
                <div style={{ display: "flex", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(235,235,245,0.45)" }}>
                    <Eye size={12} /> {views}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(235,235,245,0.45)" }}>
                    <MessageCircle size={12} /> {wa}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(235,235,245,0.45)" }}>
                    <Mail size={12} /> {email}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gate for Free plan */}
      {!hasAnalytics && (
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          borderRadius: 16,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Lock size={22} color="rgba(235,235,245,0.5)" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(235,235,245,0.8)", marginBottom: 4 }}>Analytics disponible en Pro+</div>
            <div style={{ fontSize: 13, color: "rgba(235,235,245,0.4)" }}>Actualiza tu plan para ver el rendimiento de tus listados.</div>
          </div>
        </div>
      )}
    </div>
  );
}
