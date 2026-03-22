"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { PawPrint, CheckCircle, XCircle, Clock, LogIn } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const ACCENT = "#0a84ff";

type JoinState =
  | "loading"
  | "needs-auth"
  | "invalid-token"
  | "already-member"
  | "own-pet"
  | "pending"
  | "success"
  | "error";

interface BusinessInfo {
  id: string;
  name: string;
  description: string | null;
}

interface PetInfo {
  id: string;
  name: string;
  emoji: string;
  owner_id: string;
}

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const petIdParam = searchParams.get("pet"); // optional: specific pet
  const { user } = useAuthContext();

  const [state, setState] = useState<JoinState>("loading");
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [pet, setPet] = useState<PetInfo | null>(null);
  const [ownerPets, setOwnerPets] = useState<PetInfo[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setState("invalid-token"); return; }
    if (!user) { setState("needs-auth"); return; }
    void loadBusinessAndPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function loadBusinessAndPets() {
    setState("loading");
    const supabase = createClient();

    // Look up business by token
    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name, description, owner_id")
      .eq("qr_token", token!)
      .single();

    if (!biz) {
      setState("invalid-token");
      return;
    }

    setBusiness({ id: biz.id, name: biz.name, description: biz.description });

    // Get pets owned by the business owner (not the scanning user)
    if (petIdParam) {
      const { data: p } = await supabase
        .from("pets")
        .select("id, name, emoji, owner_id")
        .eq("id", petIdParam)
        .single();
      if (p) { setPet(p as PetInfo); setSelectedPetId(p.id); }
    } else {
      // Show pets owned by the business owner that the current user can join
      const { data: pets } = await supabase
        .from("pets")
        .select("id, name, emoji, owner_id")
        .eq("owner_id", (biz as unknown as { owner_id: string }).owner_id);

      const available = (pets ?? []) as PetInfo[];
      setOwnerPets(available);
      if (available.length === 1) setSelectedPetId(available[0].id);
    }

    setState("success"); // Just means "loaded", actual join is separate
  }

  async function handleJoin() {
    if (!user || !business || !selectedPetId) return;
    setJoining(true);
    const supabase = createClient();

    // Validation: don't link to own pet
    const targetPet = pet ?? ownerPets.find((p) => p.id === selectedPetId);
    if (targetPet?.owner_id === user.id) {
      setState("own-pet");
      setJoining(false);
      return;
    }

    // Check existing membership
    const { data: existing } = await supabase
      .from("pet_members")
      .select("id, status")
      .eq("pet_id", selectedPetId)
      .eq("member_id", user.id)
      .single();

    if (existing) {
      if (existing.status === "active") { setState("already-member"); setJoining(false); return; }
      if (existing.status === "pending") { setState("pending"); setJoining(false); return; }
    }

    // Insert pending membership
    const { error } = await supabase.from("pet_members").insert({
      pet_id: selectedPetId,
      member_id: user.id,
      business_id: business.id,
      status: "pending",
      invited_by: null,
    });

    if (error) {
      if (error.code === "23505") { setState("already-member"); }
      else { setErrorMsg(error.message); setState("error"); }
    } else {
      setState("pending");
    }

    setJoining(false);
  }

  return (
    <div style={{
      minHeight: "100dvh", background: "#000", fontFamily: FONT,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(145deg, #0a84ff, #0052cc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PawPrint size={30} color="#fff" />
          </div>
        </div>

        {state === "loading" && (
          <p style={{ textAlign: "center", color: "rgba(235,235,245,0.5)" }}>Cargando…</p>
        )}

        {state === "invalid-token" && (
          <StatusCard
            icon={<XCircle size={40} color="#ff453a" />}
            title="QR no válido"
            message="Este código QR ya no es válido. Solicita el actualizado al negocio."
            color="#ff453a"
          />
        )}

        {state === "needs-auth" && (
          <StatusCard
            icon={<LogIn size={40} color={ACCENT} />}
            title="Inicia sesión primero"
            message="Necesitas una cuenta en PAW para vincularte. Abre la app e inicia sesión."
            color={ACCENT}
          >
            <a href="/" style={{ display: "block", marginTop: 16, textAlign: "center", color: ACCENT, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              Ir a la app →
            </a>
          </StatusCard>
        )}

        {state === "already-member" && (
          <StatusCard
            icon={<CheckCircle size={40} color="#34c759" />}
            title="Acceso existente"
            message="Ya tienes acceso a esta mascota"
            color="#34c759"
          />
        )}

        {state === "own-pet" && (
          <StatusCard
            icon={<XCircle size={40} color="#ff9f0a" />}
            title="No permitido"
            message="No puedes vincularte a tu propia mascota"
            color="#ff9f0a"
          />
        )}

        {state === "pending" && (
          <StatusCard
            icon={<Clock size={40} color="#ff9f0a" />}
            title="Solicitud enviada"
            message="Solicitud enviada. El dueño debe aceptar para que tengas acceso."
            color="#ff9f0a"
          />
        )}

        {state === "error" && (
          <StatusCard
            icon={<XCircle size={40} color="#ff453a" />}
            title="Error"
            message={errorMsg || "Ocurrió un error inesperado. Intenta de nuevo."}
            color="#ff453a"
          />
        )}

        {state === "success" && business && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>
                Vincularte a {business.name}
              </h1>
              {business.description && (
                <p style={{ color: "rgba(235,235,245,0.5)", fontSize: 14, marginTop: 8 }}>{business.description}</p>
              )}
            </div>

            {ownerPets.length > 1 && !pet && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
                <p style={{ padding: "12px 16px 8px", margin: 0, fontSize: 12, color: "rgba(235,235,245,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>
                  Selecciona la mascota
                </p>
                {ownerPets.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPetId(p.id)}
                    style={{
                      width: "100%", padding: "12px 16px", background: selectedPetId === p.id ? `${ACCENT}22` : "none",
                      border: "none", borderTop: "1px solid rgba(84,84,88,0.4)", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{p.emoji}</span>
                    <span style={{ fontSize: 16, color: "#fff", fontWeight: selectedPetId === p.id ? 600 : 400 }}>{p.name}</span>
                    {selectedPetId === p.id && <CheckCircle size={16} color={ACCENT} style={{ marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            )}

            {(pet ?? ownerPets.find((p) => p.id === selectedPetId)) && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 32 }}>{(pet ?? ownerPets.find((p) => p.id === selectedPetId))?.emoji}</span>
                <div>
                  <p style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 600 }}>
                    {(pet ?? ownerPets.find((p) => p.id === selectedPetId))?.name}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(235,235,245,0.5)" }}>
                    Mascota cliente de {business.name}
                  </p>
                </div>
              </div>
            )}

            {ownerPets.length === 0 && !pet && (
              <p style={{ textAlign: "center", color: "rgba(235,235,245,0.5)", fontSize: 14, marginBottom: 16 }}>
                Este negocio no tiene mascotas registradas aún.
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={joining || !selectedPetId}
              style={{
                width: "100%", padding: "14px", borderRadius: 14,
                background: selectedPetId ? ACCENT : "rgba(255,255,255,0.06)",
                border: "none", color: "#fff", fontSize: 16, fontWeight: 600,
                cursor: joining || !selectedPetId ? "not-allowed" : "pointer",
                opacity: joining ? 0.6 : 1,
              }}
            >
              {joining ? "Enviando solicitud…" : "Solicitar acceso"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusCard({ icon, title, message, color, children }: {
  icon: React.ReactNode;
  title: string;
  message: string;
  color: string;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>{icon}</div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{title}</h2>
      <p style={{ margin: "10px 0 0", fontSize: 15, color: "rgba(235,235,245,0.6)", lineHeight: 1.5 }}>{message}</p>
      {children}
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PawPrint size={40} color="#0a84ff" />
      </div>
    }>
      <JoinContent />
    </Suspense>
  );
}
