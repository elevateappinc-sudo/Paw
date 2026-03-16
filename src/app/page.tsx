"use client";
import { useStore } from "@/store";
import { AuthPage } from "@/components/auth/AuthPage";
import { PetSelector } from "@/components/pets/PetSelector";
import Sidebar from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { GastosModule } from "@/components/gastos/GastosModule";
import { EntrenamientoModule } from "@/components/entrenamiento/EntrenamientoModule";
import { VacunasModule } from "@/components/vacunas/VacunasModule";
import { PetInfoModule } from "@/components/pets/PetInfoModule";
import { ItinerarioModule } from "@/components/itinerario/ItinerarioModule";
import { NotificacionesModule } from "@/components/notificaciones/NotificacionesModule";

export default function Home() {
  const { currentUser, selectedPetId, activeModule } = useStore();

  if (!currentUser) return <AuthPage />;
  if (!selectedPetId) return <PetSelector />;

  return (
    <div style={{ minHeight: "100dvh", background: "#000000", display: "flex", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 72, paddingBottom: 80, minWidth: 0 }} className="main-content">
        <style>{`@media (max-width: 767px) { .main-content { margin-left: 0 !important; } }`}</style>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {activeModule === "dashboard"      && <Dashboard />}
          {activeModule === "gastos"         && <GastosModule />}
          {activeModule === "entrenamiento"  && <EntrenamientoModule />}
          {activeModule === "vacunas"        && <VacunasModule />}
          {activeModule === "itinerario"     && <ItinerarioModule />}
          {activeModule === "notificaciones" && <NotificacionesModule />}
          {activeModule === "info"           && <PetInfoModule />}
        </div>
      </main>
    </div>
  );
}
