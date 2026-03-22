"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { InfoCell } from "@/components/ui/Card";
import { PetForm } from "@/components/pets/PetForm";
import { formatCurrency, formatDate, getMonthKey, today } from "@/lib/utils";
import { Plus, Wallet, Dumbbell, Syringe, ChevronRight, LogOut, RefreshCw } from "lucide-react";
import { PetAvatar } from "@/components/pets/PetAvatar";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

export function Dashboard() {
  const { gastos, clases, vacunas, setActiveModule, selectedPetId, pets, selectPet } = useStore();
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "";
  const [showPetForm, setShowPetForm] = useState(false);

  // Medications state
  const [activeMeds, setActiveMeds] = useState<MedicationData[]>([]);
  const [medLogs, setMedLogs] = useState<MedicationLogData[]>([]);

  const fetchMeds = useCallback(async () => {
    if (!user || !selectedPetId) return;
    const supabase = createClient();
    const nowDate = new Date().toISOString().split("T")[0];

    const { data: meds } = await supabase
      .from("medications")
      .select("*")
      .eq("pet_id", selectedPetId)
      .eq("user_id", user.id)
      .eq("active", true)
      .or(`end_date.is.null,end_date.gte.${nowDate}`)
      .order("created_at", { ascending: false })
      .limit(3);

    const medList = (meds ?? []) as MedicationData[];
    setActiveMeds(medList);

    if (medList.length > 0) {
      const medIds = medList.map((m) => m.id);
      const { data: logs } = await supabase
        .from("medication_logs")
        .select("*")
        .in("medication_id", medIds)
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(10);
      setMedLogs((logs ?? []) as MedicationLogData[]);
    }
  }, [user, selectedPetId]);

  useEffect(() => {
    void fetchMeds();
  }, [fetchMeds]);

  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";
  const todayStr = today();

  const petGastos  = gastos.filter((g) => g.petId === selectedPetId);
  const petClases  = clases.filter((c) => c.petId === selectedPetId);
  const petVacunas = vacunas.filter((v) => v.petId === selectedPetId);

  const stats = useMemo(() => {
    const now = new Date();
    const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const thisMonth = petGastos.filter((g) => getMonthKey(g.fecha) === mk);
    const totalMes = thisMonth.reduce((s, g) => s + g.monto, 0);
    const allTareas = petClases.flatMap((c) => c.tareas);
    const pending = allTareas.filter((t) => t.estado !== "completado").length;
    return { totalMes, totalClases: petClases.length, totalVacunas: petVacunas.length, pending };
  }, [petGastos, petClases, petVacunas]);

  const recentGastos = [...petGastos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 3);

  const nextVaccine = petVacunas
    .filter((v) => v.proximaFecha && v.proximaFecha >= todayStr)
    .sort((a, b) => (a.proximaFecha ?? "").localeCompare(b.proximaFecha ?? ""))[0];

  const isOverdueVaccine = petVacunas.some((v) => v.proximaFecha && v.proximaFecha < todayStr);

  const sep = <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 60 }} />;

  return (
    <div style={{ paddingBottom: 24, fontFamily: FONT }}>

      {/* Pet Hero */}
      <div style={{ padding: "56px 24px 36px", position: "relative", overflow: "hidden" }}>
        {/* Glow */}
        <div style={{
          position: "absolute", top: -80, right: -80,
          width: 280, height: 280, borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)" }}>
              PAW
            </div>
          </div>
          <button onClick={() => void signOut()}
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogOut size={16} color="rgba(235,235,245,0.4)" />
          </button>
        </div>

        {/* Pet avatar + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {pet ? (
            <PetAvatar
              pet={pet}
              size="lg"
              style={{
                borderRadius: 22,
                border: `2px solid ${accentColor}30`,
                width: 80, height: 80,
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: `${accentColor}20`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40,
              border: `2px solid ${accentColor}30`,
              flexShrink: 0,
            }}>🐾</div>
          )}
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: -0.5 }}>
              {pet?.name ?? "Mi mascota"}
            </h1>
            <p style={{ fontSize: 15, color: "rgba(235,235,245,0.5)", margin: "4px 0 0" }}>
              {pet?.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1) : ""}
              {pet?.breed ? ` · ${pet.breed}` : ""}
            </p>
            {displayName && (
              <p style={{ fontSize: 12, color: "rgba(235,235,245,0.3)", margin: "2px 0 0" }}>
                {displayName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
          Resumen
        </p>
        <div style={{ background: "#1c1c1e", borderRadius: 20, padding: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InfoCell label="Gasto del mes"     value={formatCurrency(stats.totalMes)}    onClick={() => setActiveModule("gastos")} />
            <InfoCell label="Clases totales"    value={String(stats.totalClases)}          onClick={() => setActiveModule("entrenamiento")} />
            <InfoCell label="Vacunas"           value={String(stats.totalVacunas)}         onClick={() => setActiveModule("vacunas")} />
            <InfoCell label="Tareas pendientes" value={String(stats.pending)}              onClick={() => setActiveModule("entrenamiento")} />
          </div>
        </div>
      </div>

      {/* Overdue vaccine alert */}
      {isOverdueVaccine && (
        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <div style={{ background: "rgba(255,69,58,0.12)", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(255,69,58,0.2)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#ff453a", margin: 0 }}>Vacuna vencida</p>
              <p style={{ fontSize: 13, color: "rgba(235,235,245,0.6)", margin: "2px 0 0" }}>Revisa el historial de vacunas</p>
            </div>
            <button onClick={() => setActiveModule("vacunas")} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <ChevronRight size={18} color="#ff453a" />
            </button>
          </div>
        </div>
      )}

      {/* Next vaccine */}
      {nextVaccine && !isOverdueVaccine && (
        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <div style={{ background: "rgba(48,209,88,0.08)", borderRadius: 14, padding: "14px 16px", border: "1px solid rgba(48,209,88,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
            <Syringe size={20} color="#30d158" />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#30d158", margin: 0 }}>
                Próxima vacuna: {nextVaccine.nombre}
              </p>
              <p style={{ fontSize: 13, color: "rgba(235,235,245,0.6)", margin: "2px 0 0" }}>
                {formatDate(nextVaccine.proximaFecha!)}
              </p>
            </div>
            <button onClick={() => setActiveModule("vacunas")} style={{ background: "none", border: "none", cursor: "pointer" }}>
              <ChevronRight size={18} color="#30d158" />
            </button>
          </div>
        </div>
      )}

      {/* Medicamentos activos */}
      {activeMeds.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", margin: 0 }}>
              Medicamentos activos
            </p>
            <button onClick={() => setActiveModule("medicamentos")}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: accentColor, background: "none", border: "none", cursor: "pointer" }}>
              Ver todos <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden" }}>
            {activeMeds.map((med, i) => {
              const nextLog = medLogs
                .filter((l) => l.medication_id === med.id && l.status === "pending")
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
              const nextTime = nextLog
                ? new Date(nextLog.scheduled_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
                : null;
              return (
                <div key={med.id}>
                  {i > 0 && sep}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `${accentColor}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Pill size={20} color={accentColor} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {med.name}
                      </p>
                      <p style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", margin: 0 }}>
                        {med.dose_amount} {med.dose_unit}
                        {nextTime ? ` · Próx: ${nextTime}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent gastos */}
      {recentGastos.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", margin: 0 }}>
              Gastos recientes
            </p>
            <button onClick={() => setActiveModule("gastos")}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: accentColor, background: "none", border: "none", cursor: "pointer" }}>
              Ver todos <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden" }}>
            {recentGastos.map((g, i) => (
              <div key={g.id}>
                {i > 0 && sep}
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                    background: `${accentColor}18`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, fontWeight: 700, color: accentColor,
                  }}>
                    {g.concepto.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {g.concepto}
                    </p>
                    <p style={{ fontSize: 12, color: "rgba(235,235,245,0.5)", margin: 0 }}>
                      {formatDate(g.fecha)} · {g.quien}
                    </p>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                    {formatCurrency(g.monto)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
          Acciones rápidas
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "Nuevo gasto", icon: <Wallet size={20} />, action: () => setActiveModule("gastos") },
            { label: "Nueva clase", icon: <Dumbbell size={20} />, action: () => setActiveModule("entrenamiento") },
            { label: "Vacuna",      icon: <Syringe size={20} />, action: () => setActiveModule("vacunas") },
          ].map((a) => (
            <button key={a.label} onClick={a.action}
              style={{
                padding: "16px 8px", borderRadius: 14,
                background: "#1c1c1e", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                color: accentColor, fontFamily: FONT,
              }}>
              {a.icon}
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(235,235,245,0.7)", textAlign: "center" }}>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mascotas */}
      <div style={{ padding: "0 16px", marginBottom: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(235,235,245,0.4)", marginBottom: 10 }}>
          Mascotas
        </p>
        <div style={{ background: "#1c1c1e", borderRadius: 16, overflow: "hidden" }}>
          {/* Cambiar mascota */}
          <button onClick={() => selectPet(null)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={20} color="rgba(235,235,245,0.5)" />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>Cambiar mascota</p>
              <p style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", margin: 0 }}>Ver todas tus mascotas</p>
            </div>
            <ChevronRight size={16} color="rgba(235,235,245,0.3)" />
          </button>
          {/* Separator */}
          <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 60 }} />
          {/* Agregar mascota */}
          <button onClick={() => setShowPetForm(true)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "transparent", border: "none", cursor: "pointer", fontFamily: FONT }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={20} color={accentColor} />
            </div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0 }}>Agregar mascota</p>
              <p style={{ fontSize: 12, color: "rgba(235,235,245,0.4)", margin: 0 }}>Registrar una nueva</p>
            </div>
            <ChevronRight size={16} color="rgba(235,235,245,0.3)" />
          </button>
        </div>
      </div>

      {/* Empty state */}
      {petGastos.length === 0 && petClases.length === 0 && petVacunas.length === 0 && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ background: "#1c1c1e", borderRadius: 20, padding: "36px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🐾</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>¡Empieza a registrar!</p>
            <p style={{ fontSize: 14, color: "rgba(235,235,245,0.5)", marginTop: 6, marginBottom: 20 }}>
              Registra gastos, clases de entrenamiento y vacunas de {pet?.name}
            </p>
            <button onClick={() => setActiveModule("gastos")}
              style={{ width: "100%", padding: "14px", borderRadius: 13, background: accentColor, border: "none", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FONT }}>
              Agregar primer gasto
            </button>
          </div>
        </div>
      )}

      {showPetForm && <PetForm onClose={() => setShowPetForm(false)} />}
    </div>
  );
}
