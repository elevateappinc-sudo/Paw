"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { PawPrint, CheckCircle, XCircle, Clock, LogIn } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const ACCENT = "#0a84ff";

type JoinState = "loading" | "needs-auth" | "invalid-token" | "already-member" | "own-pet" | "pending" | "ready" | "error";

interface BusinessInfo { id: string; name: string; description: string | null; owner_id: string; }
interface PetInfo { id: string; name: string; emoji: string; owner_id: string; }

function StatusCard({ icon, title, message, color, children }: { icon: React.ReactNode; title: string; message: string; color: string; children?: React.ReactNode }) {
  return (
    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>{icon}</div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#fff" }}>{title}</h2>
      <p style={{ margin: "10px 0 0", fontSize: 15, color: "rgba(235,235,245,0.6)", lineHeight: 1.5 }}>{message}</p>
      {children}
    </div>
  );
}

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuthContext();

  const [state, setState] = useState<JoinState>("loading");
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [ownerPets, setOwnerPets] = useState<PetInfo[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setState("invalid-token"); return; }
    if (!user) { setState("needs-auth"); return; }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function load() {
    setState("loading");
    const supabase = createClient();
    const { data: biz } = await supabase.from("businesses").select("id, name, description, owner_id").eq("qr_token", token!).single();
    if (!biz) { setState("invalid-token"); return; }
    setBusiness(biz as BusinessInfo);

    const { data: pets } = await supabase.from("pets").select("id, name, emoji, user_id").eq("user_id", (biz as BusinessInfo).owner_id);
    const list = ((pets ?? []) as Array<{id: string; name: string; emoji: string; user_id: string}>).map(p => ({ id: p.id, name: p.name, emoji: p.emoji, owner_id: p.user_id }));
    setOwnerPets(list);
    if (list.length === 1) setSelectedPetId(list[0].id);
    setState("ready");
  }

  async function handleJoin() {
    if (!user || !business || !selectedPetId) return;
    setJoining(true);
    const supabase = createClient();

    const targetPet = ownerPets.find((p) => p.id === selectedPetId);
    if (targetPet?.owner_id === user.id) { setState("own-pet"); setJoining(false); return; }

    const { data: existing } = await supabase.from("pet_members").select("id, status").eq("pet_id", selectedPetId).eq("member_id", user.id).single();
    if (existing) {
      if (existing.status === "active") { setState("already-member"); setJoining(false); return; }
      if (existing.status === "pending") { setState("pending"); setJoining(false); return; }
    }

    const { error } = await supabase.from("pet_members").insert({ pet_id: selectedPetId, member_id: user.id, business_id: business.id, status: "pending" });
    if (error) {
      if (error.code === "23505") setState("already-member");
      else { setErrorMsg(error.message); setState("error"); }
    } else {
      setState("pending");
    }
    setJoining(false);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#000", fontFamily: FONT, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(145deg, #0a84ff, #0052cc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PawPrint size={30} color="#fff" />
          </div>
        </div>

        {state === "loading" && <p style={{ textAlign: "center", color: "rgba(235,235,245,0.5)" }}>Cargando…</p>}

        {state === "invalid-token" && <StatusCard icon={<XCircle size={40} color="#ff453a" />} title="QR no válido" message="Este código QR ya no es válido. Solicita el actualizado al negocio." color="#ff453a" />}

        {state === "needs-auth" && (
          <StatusCard icon={<LogIn size={40} color={ACCENT} />} title="Inicia sesión primero" message="Necesitas una cuenta en PAW para vincularte." color={ACCENT}>
            <a href="/" style={{ display: "block", marginTop: 16, textAlign: "center", color: ACCENT, fontSize: 15, fontWeight: 600, textDecoration: "none" }}>Ir a la app →</a>
          </StatusCard>
        )}

        {state === "already-member" && <StatusCard icon={<CheckCircle size={40} color="#34c759" />} title="Acceso existente" message="Ya tienes acceso a esta mascota" color="#34c759" />}

        {state === "own-pet" && <StatusCard icon={<XCircle size={40} color="#ff9f0a" />} title="No permitido" message="No puedes vincularte a tu propia mascota" color="#ff9f0a" />}

        {state === "pending" && <StatusCard icon={<Clock size={40} color="#ff9f0a" />} title="Solicitud enviada" message="Solicitud enviada. El dueño debe aceptar para que tengas acceso." color="#ff9f0a" />}

        {state === "error" && <StatusCard icon={<XCircle size={40} color="#ff453a" />} title="Error" message={errorMsg || "Ocurrió un error inesperado."} color="#ff453a" />}

        {state === "ready" && business && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: 0 }}>Vincularte a {business.name}</h1>
              {business.description && <p style={{ color: "rgba(235,235,245,0.5)", fontSize: 14, marginTop: 8 }}>{business.description}</p>}
            </div>

            {ownerPets.length > 1 && (
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
                <p style={{ padding: "12px 16px 8px", margin: 0, fontSize: 12, color: "rgba(235,235,245,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Selecciona la mascota</p>
                {ownerPets.map((p) => (
                  <button key={p.id} onClick={() => setSelectedPetId(p.id)}
                    style={{ width: "100%", padding: "12px 16px", background: selectedPetId === p.id ? `${ACCENT}22` : "none", border: "none", borderTop: "1px solid rgba(84,84,88,0.4)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
                    <span style={{ fontSize: 24 }}>{p.emoji}</span>
                    <span style={{ fontSize: 16, color: "#fff", fontWeight: selectedPetId === p.id ? 600 : 400 }}>{p.name}</span>
                    {selectedPetId === p.id && <CheckCircle size={16} color={ACCENT} style={{ marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            )}

            {ownerPets.length === 0 && <p style={{ textAlign: "center", color: "rgba(235,235,245,0.5)", fontSize: 14, marginBottom: 16 }}>Este negocio no tiene mascotas registradas.</p>}

            <button onClick={handleJoin} disabled={joining || !selectedPetId}
              style={{ width: "100%", padding: "14px", borderRadius: 14, background: selectedPetId ? ACCENT : "rgba(255,255,255,0.06)", border: "none", color: "#fff", fontSize: 16, fontWeight: 600, cursor: joining || !selectedPetId ? "not-allowed" : "pointer", opacity: joining ? 0.6 : 1 }}>
              {joining ? "Enviando solicitud…" : "Solicitar acceso"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100dvh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}><PawPrint size={40} color="#0a84ff" /></div>}>
      <JoinContent />
    </Suspense>
  );
}
