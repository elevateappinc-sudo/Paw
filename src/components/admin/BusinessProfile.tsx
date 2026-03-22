"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Pencil, RefreshCw, Check, X, Building2, QrCode } from "lucide-react";
import { useBusinesses, type Business } from "@/hooks/useBusinesses";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const ACCENT = "#0a84ff";

interface Props {
  business: Business;
  onUpdate: () => void;
}

export function BusinessProfile({ business, onUpdate }: Props) {
  const { updateBusiness, refreshQrToken } = useBusinesses();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description ?? "");
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState("");

  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}/join?token=${business.qr_token}`
    : `https://app.pawapp.io/join?token=${business.qr_token}`;

  async function handleSave() {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError("");
    try {
      await updateBusiness(business.id, { name: name.trim(), description: description.trim() || null });
      setEditing(false);
      onUpdate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleRefreshQr() {
    setRefreshing(true);
    try {
      await refreshQrToken(business.id);
      onUpdate();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ padding: "32px 20px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: `${ACCENT}22`, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${ACCENT}33` }}>
          <Building2 size={30} color={ACCENT} />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#fff" }}>{business.name}</h2>
          {business.description && (
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(235,235,245,0.5)" }}>{business.description}</p>
          )}
        </div>
        <button
          onClick={() => { setEditing(!editing); setName(business.name); setDescription(business.description ?? ""); }}
          style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 12, padding: "8px 12px", cursor: "pointer", color: "#fff" }}
        >
          {editing ? <X size={18} /> : <Pencil size={18} />}
        </button>
      </div>

      {editing && (
        <div style={{ margin: "0 20px 12px", background: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16 }}>
          <label style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Nombre del negocio</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Veterinaria Los Pinos"
            style={{ display: "block", width: "100%", marginTop: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }}
          />
          <label style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", textTransform: "uppercase", letterSpacing: 1, display: "block", marginTop: 14 }}>Descripción (opcional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve descripción"
            rows={3}
            style={{ display: "block", width: "100%", marginTop: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 15, outline: "none", resize: "none", boxSizing: "border-box" }}
          />
          {error && <p style={{ color: "#ff453a", fontSize: 13, marginTop: 8 }}>{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ marginTop: 14, width: "100%", padding: "12px", borderRadius: 12, background: ACCENT, border: "none", color: "#fff", fontSize: 16, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Check size={17} /> {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}

      <div style={{ padding: "0 20px" }}>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
          <button
            onClick={() => setShowQr(!showQr)}
            style={{ width: "100%", padding: "16px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${ACCENT}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QrCode size={20} color={ACCENT} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 600 }}>Código QR de vinculación</p>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(235,235,245,0.5)" }}>Los clientes lo escanean para vincularse</p>
            </div>
            <span style={{ color: "rgba(235,235,245,0.3)", fontSize: 20 }}>›</span>
          </button>

          {showQr && (
            <div style={{ padding: "0 16px 20px", borderTop: "1px solid rgba(84,84,88,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                <div style={{ background: "#fff", padding: 16, borderRadius: 16 }}>
                  <QRCodeSVG value={joinUrl} size={200} />
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 13, color: "rgba(235,235,245,0.4)", margin: "0 0 16px" }}>
                URL: /join?token=…
              </p>
              <button
                onClick={handleRefreshQr}
                disabled={refreshing}
                style={{ width: "100%", padding: "12px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#ff9f0a", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: refreshing ? 0.6 : 1 }}
              >
                <RefreshCw size={15} />
                {refreshing ? "Actualizando…" : "Generar nuevo QR"}
              </button>
              <p style={{ textAlign: "center", fontSize: 12, color: "rgba(235,235,245,0.3)", margin: "10px 0 0" }}>
                Al generar uno nuevo, el anterior dejará de funcionar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
