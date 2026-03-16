"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { Bell, Plus, Trash2, X, CheckCheck, Syringe, AlertTriangle } from "lucide-react";
import { today, formatDate } from "@/lib/utils";
import type { Notificacion } from "@/types";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

const TIPO_CONFIG: Record<Notificacion["tipo"], { color: string; bg: string; label: string }> = {
  nota:        { color: "#0a84ff", bg: "rgba(10,132,255,0.12)",  label: "Nota" },
  alerta:      { color: "#ff9f0a", bg: "rgba(255,159,10,0.12)",  label: "Alerta" },
  logro:       { color: "#30d158", bg: "rgba(48,209,88,0.12)",   label: "Logro" },
};

const inputS: React.CSSProperties = {
  width: "100%", padding: "14px 16px", fontSize: 16, color: "#fff",
  background: "transparent", border: "none", outline: "none",
  fontFamily: FONT, boxSizing: "border-box",
};

// ── Note Form ─────────────────────────────────────────────────────────────────
function NotaForm({ onClose, accentColor }: { onClose: () => void; accentColor: string }) {
  const { addNotificacion } = useStore();
  const [tipo,    setTipo]    = useState<Notificacion["tipo"]>("nota");
  const [titulo,  setTitulo]  = useState("");
  const [mensaje, setMensaje] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    addNotificacion({ tipo, titulo: titulo.trim(), mensaje: mensaje.trim() });
    onClose();
  }

  const sep = <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
      <div style={{ width: "100%", maxHeight: "85dvh", overflowY: "auto", background: "#1c1c1e", borderRadius: "20px 20px 0 0", fontFamily: FONT }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 16px" }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>Nueva notificación</h2>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={15} color="rgba(235,235,245,0.6)" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "0 20px 40px" }}>
          {/* Tipo */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(Object.entries(TIPO_CONFIG) as [Notificacion["tipo"], typeof TIPO_CONFIG[keyof typeof TIPO_CONFIG]][]).map(([t, cfg]) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                style={{
                  flex: 1, padding: "10px 4px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: tipo === t ? cfg.bg : "rgba(255,255,255,0.05)",
                  color: tipo === t ? cfg.color : "rgba(235,235,245,0.4)",
                  fontSize: 13, fontWeight: 600, fontFamily: FONT,
                  outline: tipo === t ? `1.5px solid ${cfg.color}` : "none",
                }}>
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Título + Mensaje */}
          <div style={{ background: "#2c2c2e", borderRadius: 13, overflow: "hidden", marginBottom: 12 }}>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)}
              placeholder="Título *" required style={inputS} />
            {sep}
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)}
              placeholder="Mensaje (opcional)..." rows={3}
              style={{ ...inputS, resize: "none", fontSize: 15 }} />
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "15px", borderRadius: 13, background: "rgba(255,255,255,0.08)", border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "rgba(235,235,245,0.6)", fontFamily: FONT }}>
              Cancelar
            </button>
            <button type="submit"
              style={{ flex: 2, padding: "15px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
              Publicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Module ───────────────────────────────────────────────────────────────
export function NotificacionesModule() {
  const { notificaciones, vacunas, marcarLeida, deleteNotificacion, marcarTodasLeidas, selectedPetId, pets, users, currentUser } = useStore();
  const [showForm, setShowForm] = useState(false);

  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";
  const todayStr = today();

  const petNotifs = notificaciones.filter((n) => n.petId === selectedPetId);
  const unreadCount = petNotifs.filter((n) => !n.leida).length;

  // Auto-alerts from data
  const petVacunas = vacunas.filter((v) => v.petId === selectedPetId);
  const overdueVacunas = petVacunas.filter((v) => v.proximaFecha && v.proximaFecha < todayStr);
  const upcomingVacunas = petVacunas.filter((v) => {
    if (!v.proximaFecha || v.proximaFecha < todayStr) return false;
    const diffDays = Math.ceil((new Date(v.proximaFecha).getTime() - Date.now()) / 86400000);
    return diffDays <= 7;
  });

  function authorName(authorId: string) {
    if (authorId === currentUser?.id) return "Tú";
    return users.find((u) => u.id === authorId)?.name ?? "Usuario";
  }

  function timeAgo(iso: string) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins  = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days > 0)  return `hace ${days}d`;
    if (hours > 0) return `hace ${hours}h`;
    if (mins > 0)  return `hace ${mins}m`;
    return "ahora";
  }

  const section = (label: string) => (
    <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
      {label}
    </p>
  );

  return (
    <div style={{ paddingBottom: 24, fontFamily: FONT }}>

      {/* Hero */}
      <div style={{ padding: "56px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Bell size={15} color={`${accentColor}cc`} />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
              {pet?.name ?? "Mascota"}
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.5 }}>Notificaciones</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>
            Actividad y alertas de {pet?.name}
          </p>
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>

        {/* Auto-alerts */}
        {(overdueVacunas.length > 0 || upcomingVacunas.length > 0) && (
          <div style={{ marginBottom: 24 }}>
            {section("Alertas automáticas")}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {overdueVacunas.map((v) => (
                <div key={v.id} style={{ background: "#1c1c1e", borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid rgba(255,69,58,0.2)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,69,58,0.15)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AlertTriangle size={18} color="#ff453a" />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#ff453a", margin: 0 }}>Vacuna vencida</p>
                    <p style={{ fontSize: 13, color: "rgba(235,235,245,0.6)", margin: "3px 0 0" }}>
                      {v.nombre} · venció el {formatDate(v.proximaFecha!)}
                    </p>
                  </div>
                </div>
              ))}
              {upcomingVacunas.map((v) => {
                const days = Math.ceil((new Date(v.proximaFecha!).getTime() - Date.now()) / 86400000);
                return (
                  <div key={v.id} style={{ background: "#1c1c1e", borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start", border: "1px solid rgba(48,209,88,0.15)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(48,209,88,0.12)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Syringe size={18} color="#30d158" />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#30d158", margin: 0 }}>Vacuna próxima</p>
                      <p style={{ fontSize: 13, color: "rgba(235,235,245,0.6)", margin: "3px 0 0" }}>
                        {v.nombre} · en {days} día{days !== 1 ? "s" : ""} ({formatDate(v.proximaFecha!)})
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* User notifications */}
        {petNotifs.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              {section(`Actividad${unreadCount > 0 ? ` · ${unreadCount} nuevas` : ""}`)}
              {unreadCount > 0 && (
                <button onClick={marcarTodasLeidas}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: accentColor, background: "none", border: "none", cursor: "pointer", fontFamily: FONT, marginBottom: 10 }}>
                  <CheckCheck size={14} /> Marcar todas
                </button>
              )}
            </div>
            <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden" }}>
              {petNotifs.map((n, i) => {
                const cfg = TIPO_CONFIG[n.tipo];
                return (
                  <div key={n.id}>
                    {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 60 }} />}
                    <div style={{ display: "flex", gap: 12, padding: "13px 16px", background: n.leida ? "transparent" : `${accentColor}06` }}>
                      {/* Dot indicator */}
                      <div style={{ paddingTop: 4, flexShrink: 0 }}>
                        {!n.leida && <div style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor }} />}
                        {n.leida  && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "transparent" }} />}
                      </div>
                      {/* Icon */}
                      <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Bell size={16} color={cfg.color} />
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999, background: cfg.bg, color: cfg.color }}>
                            {cfg.label}
                          </span>
                          <span style={{ fontSize: 11, color: "rgba(235,235,245,0.35)" }}>{authorName(n.autorId)} · {timeAgo(n.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>{n.titulo}</p>
                        {n.mensaje && (
                          <p style={{ fontSize: 13, color: "rgba(235,235,245,0.55)", margin: "3px 0 0" }}>{n.mensaje}</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                        {!n.leida && (
                          <button onClick={() => marcarLeida(n.id)}
                            style={{ width: 26, height: 26, borderRadius: 7, background: `${accentColor}18`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <CheckCheck size={12} color={accentColor} />
                          </button>
                        )}
                        {n.autorId === currentUser?.id && (
                          <button onClick={() => deleteNotificacion(n.id)}
                            style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(255,69,58,0.12)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 size={12} color="#ff453a" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty */}
        {petNotifs.length === 0 && overdueVacunas.length === 0 && upcomingVacunas.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "#1c1c1e", borderRadius: 20, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, margin: "0 auto 14px", background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={24} color={accentColor} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Sin notificaciones</p>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", marginTop: 6, marginBottom: 20 }}>
              Publica notas sobre {pet?.name} visibles para todos los usuarios con acceso
            </p>
            <button onClick={() => setShowForm(true)}
              style={{ width: "100%", padding: 14, borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FONT }}>
              Publicar primera nota
            </button>
          </div>
        )}

        {/* CTA */}
        {(petNotifs.length > 0 || overdueVacunas.length > 0) && (
          <button onClick={() => setShowForm(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: FONT }}>
            <Plus size={18} /> Nueva nota
          </button>
        )}
      </div>

      {showForm && <NotaForm onClose={() => setShowForm(false)} accentColor={accentColor} />}
    </div>
  );
}
