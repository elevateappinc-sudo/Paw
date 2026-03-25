"use client";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/store";
import { LayoutDashboard, Wallet, Dumbbell, Syringe, Info, PawPrint, Clock, Bell, ShoppingBag, Pill, Link2, ImageIcon } from "lucide-react";
import Link from "next/link";
import { PetAvatar } from "@/components/pets/PetAvatar";

const NAV: { id: string; label: string; icon: React.ReactNode; href: string }[] = [
  { id: "home",           label: "Inicio",   icon: <LayoutDashboard size={19} />, href: "/home" },
  { id: "gastos",         label: "Gastos",   icon: <Wallet size={19} />,          href: "/gastos" },
  { id: "entrenamiento",  label: "Entrena",  icon: <Dumbbell size={19} />,        href: "/actividad/entrenamiento" },
  { id: "vacunas",        label: "Vacunas",  icon: <Syringe size={19} />,         href: "/salud/vacunas" },
  { id: "itinerario",     label: "Horario",  icon: <Clock size={19} />,           href: "/actividad/itinerario" },
  { id: "notificaciones", label: "Avisos",   icon: <Bell size={19} />,            href: "/notificaciones" },
  { id: "medicamentos",   label: "Medicam.", icon: <Pill size={19} />,            href: "/salud/medicamentos" },
  { id: "marketplace",    label: "Market",   icon: <ShoppingBag size={19} />,     href: "/marketplace" },
  { id: "galeria",        label: "Galería",  icon: <ImageIcon size={19} />,       href: "/galeria" },
  { id: "info",           label: "Info",     icon: <Info size={19} />,            href: "/mascotas" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { notificaciones, selectedPetId, pets, selectPet } = useStore();
  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";

  const unread = notificaciones.filter((n) => n.petId === selectedPetId && !n.leida).length;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

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
            const active = isActive(item.href);
            const badge = item.id === "notificaciones" && unread > 0;
            return (
              <button key={item.id} onClick={() => router.push(item.href)} title={item.label}
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
          <button onClick={() => router.push("/mascotas")} title="Mis mascotas"
            style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, overflow: "hidden", padding: 0 }}>
            {pet ? (
              <PetAvatar pet={pet} size="sm" style={{ borderRadius: 12, width: 40, height: 40 }} />
            ) : (
              "🐾"
            )}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
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
            const active = isActive(item.href);
            const badge = item.id === "notificaciones" && unread > 0;
            return (
              <button key={item.id} onClick={() => router.push(item.href)}
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
