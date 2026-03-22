"use client";
import { useStore } from "@/store";
import type { ActiveModule } from "@/types";
import { LayoutDashboard, Wallet, Dumbbell, Syringe, Info, PawPrint, Clock, Bell, Stethoscope } from "lucide-react";

const NAV: { id: ActiveModule; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",       label: "Inicio",    icon: <LayoutDashboard size={19} /> },
  { id: "gastos",          label: "Gastos",    icon: <Wallet size={19} /> },
  { id: "entrenamiento",   label: "Entrena",   icon: <Dumbbell size={19} /> },
  { id: "vacunas",         label: "Vacunas",   icon: <Syringe size={19} /> },
  { id: "historial",       label: "Historial", icon: <Stethoscope size={19} /> },
  { id: "itinerario",      label: "Horario",   icon: <Clock size={19} /> },
  { id: "notificaciones",  label: "Avisos",    icon: <Bell size={19} /> },
  { id: "info",            label: "Info",      icon: <Info size={19} /> },
];

export default function Sidebar() {
  const { activeModule, setActiveModule, notificaciones, selectedPetId, pets, selectPet } = useStore();
  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";

  const unread = notificaciones.filter((n) => n.petId === selectedPetId && !n.leida).length;

  return (
    <>
      <style>{`
        @media (max-width: 767px) { .desktop-sidebar { display: none !important; } }
        @media (min-width: 768px) { .mobile-nav { display: none !important; } }
      `}</style>

      {/* Desktop sidebar */}
      <aside className="desktop-sidebar" style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: 72,
        background: "#0a0a0a", borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex", flexDirection: "column", alignItems: "center",
        zIndex: 40,
      }}>
        {/* Logo */}
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(145deg, #0a84ff, #0052cc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PawPrint size={18} color="white" />
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, paddingTop: 8 }}>
          {NAV.map((item) => {
            const active = activeModule === item.id;
            const badge  = item.id === "notificaciones" && unread > 0;
            return (
              <button key={item.id} onClick={() => setActiveModule(item.id)} title={item.label}
                style={{
                  width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                  background: active ? `${accentColor}1a` : "transparent",
                  color: active ? accentColor : "rgba(235,235,245,0.3)",
                  border: "none", cursor: "pointer", position: "relative", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(235,235,245,0.6)"; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = active ? `${accentColor}1a` : "transparent"; e.currentTarget.style.color = active ? accentColor : "rgba(235,235,245,0.3)"; }}
              >
                {item.icon}
                {badge && (
                  <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%", background: "#ff453a", border: "2px solid #0a0a0a" }} />
                )}
                {active && (
                  <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, borderRadius: "2px 0 0 2px", background: accentColor }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Integrations link */}
        <Link href="/settings/integrations" title="Integraciones" style={{
          width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(235,235,245,0.3)", textDecoration: "none", marginBottom: 4,
        }}>
          <Link2 size={19} />
        </Link>

        {/* Back to pets */}
        <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button onClick={() => selectPet(null)} title="Cambiar mascota"
            style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
            {pet?.emoji ?? "🐾"}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav — scrollable to fit 7 items */}
      <nav className="mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        zIndex: 40, overflowX: "auto",
        display: "flex", alignItems: "center",
        height: 58,
      }}>
        <style>{`.mobile-nav::-webkit-scrollbar { display: none; }`}</style>
        <div style={{ display: "flex", alignItems: "center", minWidth: "max-content", padding: "0 4px" }}>
          {NAV.map((item) => {
            const active = activeModule === item.id;
            const badge  = item.id === "notificaciones" && unread > 0;
            return (
              <button key={item.id} onClick={() => setActiveModule(item.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  padding: "4px 14px", background: "none", border: "none", cursor: "pointer",
                  color: active ? accentColor : "rgba(235,235,245,0.35)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                  position: "relative", flexShrink: 0,
                }}>
                {item.icon}
                {badge && (
                  <span style={{ position: "absolute", top: 2, right: 10, width: 7, height: 7, borderRadius: "50%", background: "#ff453a", border: "2px solid #000" }} />
                )}
                <span style={{ fontSize: 9, fontWeight: 600 }}>{item.label}</span>
              </button>
            );
          })}
          {/* Integrations mobile item */}
          <Link href="/settings/integrations" style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            padding: "4px 14px", textDecoration: "none",
            color: "rgba(235,235,245,0.35)", flexShrink: 0,
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
          }}>
            <Link2 size={19} />
            <span style={{ fontSize: 9, fontWeight: 600 }}>Integrac.</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
