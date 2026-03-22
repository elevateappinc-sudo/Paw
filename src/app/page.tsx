"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase/client";
import { AuthPage } from "@/components/auth/AuthPage";
import { MigrationModal } from "@/components/auth/MigrationModal";
import { PetSelector } from "@/components/pets/PetSelector";
import Sidebar from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { GastosModule } from "@/components/gastos/GastosModule";
import { EntrenamientoModule } from "@/components/entrenamiento/EntrenamientoModule";
import { VacunasModule } from "@/components/vacunas/VacunasModule";
import { PetInfoModule } from "@/components/pets/PetInfoModule";
import { ItinerarioModule } from "@/components/itinerario/ItinerarioModule";
import { NotificacionesModule } from "@/components/notificaciones/NotificacionesModule";
import { MedicationsModule } from "@/components/medications/MedicationsModule";
import { MarketplaceModule } from "@/components/marketplace/MarketplaceModule";

export default function Home() {
  const { user, loading } = useAuthContext();
  const { selectedPetId, activeModule } = useStore();
  const [showMigration, setShowMigration] = useState(false);
  const [migrationChecked, setMigrationChecked] = useState(false);

  // Check if migration is needed after login
  useEffect(() => {
    if (!user || migrationChecked) return;

    async function checkMigration() {
      if (!user) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("users")
        .select("migration_completed")
        .eq("id", user.id)
        .single();

      if (!data?.migration_completed) {
        // Check if there are local pets to migrate
        const rawStore = localStorage.getItem("paw-store-v3");
        if (rawStore) {
          try {
            const parsed = JSON.parse(rawStore) as { state?: { pets?: unknown[] } };
            const localPets = parsed?.state?.pets ?? [];
            if (localPets.length > 0) {
              setShowMigration(true);
            } else {
              // No local data — mark as completed silently
              await supabase
                .from("users")
                .update({ migration_completed: true })
                .eq("id", user.id);
            }
          } catch {
            // Corrupt localStorage — mark completed
            await supabase
              .from("users")
              .update({ migration_completed: true })
              .eq("id", user.id);
          }
        } else {
          await supabase
            .from("users")
            .update({ migration_completed: true })
            .eq("id", user.id);
        }
      }

      setMigrationChecked(true);
    }

    void checkMigration();
  }, [user, migrationChecked]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#000000",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ color: "rgba(235,235,245,0.3)", fontSize: 15 }}>Cargando...</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <>
      {showMigration && (
        <MigrationModal
          user={user}
          onComplete={() => setShowMigration(false)}
        />
      )}
      {!selectedPetId ? (
        <PetSelector />
      ) : (
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
              {activeModule === "medicamentos"   && <MedicationsModule />}
              {activeModule === "info"           && <PetInfoModule />}
              {activeModule === "historial"      && <ClinicalRecordsModule />}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
