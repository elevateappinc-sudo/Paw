"use client";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, LogIn, PawPrint } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button, Card, EmptyState, Skeleton } from "@/components/ui";

type JoinState = "loading" | "needs-auth" | "invalid-token" | "already-member" | "own-pet" | "pending" | "ready" | "error";

interface BusinessInfo {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
}
interface PetInfo {
  id: string;
  name: string;
  emoji: string;
  owner_id: string;
}

function JoinSkeleton() {
  return (
    <div className="flex w-full max-w-[400px] flex-col items-center gap-6" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-16 w-16 rounded-card-lg" />
      <Skeleton className="h-[200px] w-full rounded-card-lg" />
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
    if (!token) {
      setState("invalid-token");
      return;
    }
    if (!user) {
      setState("needs-auth");
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function load() {
    setState("loading");
    const supabase = createClient();
    const { data: biz } = await supabase.from("businesses").select("id, name, description, owner_id").eq("qr_token", token!).single();
    if (!biz) {
      setState("invalid-token");
      return;
    }
    const bizData = biz as BusinessInfo;
    setBusiness(bizData);
    const { data: pets } = await supabase.from("pets").select("id, name, emoji, user_id").eq("user_id", bizData.owner_id);
    const list: PetInfo[] = ((pets ?? []) as Array<{ id: string; name: string; emoji: string; user_id: string }>).map((p) => ({
      id: p.id,
      name: p.name,
      emoji: p.emoji,
      owner_id: p.user_id,
    }));
    setOwnerPets(list);
    if (list.length === 1) setSelectedPetId(list[0].id);
    setState("ready");
  }

  async function handleJoin() {
    if (!user || !business || !selectedPetId) return;
    setJoining(true);
    const supabase = createClient();
    const targetPet = ownerPets.find((p) => p.id === selectedPetId);
    if (targetPet?.owner_id === user.id) {
      setState("own-pet");
      setJoining(false);
      return;
    }
    const { data: existing } = await supabase.from("pet_members").select("id, status").eq("pet_id", selectedPetId).eq("member_id", user.id).single();
    if (existing) {
      const ex = existing as { id: string; status: string };
      if (ex.status === "active") {
        setState("already-member");
        setJoining(false);
        return;
      }
      if (ex.status === "pending") {
        setState("pending");
        setJoining(false);
        return;
      }
    }
    const { error } = await supabase.from("pet_members").insert({ pet_id: selectedPetId, member_id: user.id, business_id: business.id, status: "pending" });
    if (error) {
      if (error.code === "23505") setState("already-member");
      else {
        setErrorMsg(error.message);
        setState("error");
      }
    } else {
      setState("pending");
    }
    setJoining(false);
  }

  if (state === "loading") return <JoinSkeleton />;

  return (
    <div className="flex w-full max-w-[400px] flex-col gap-6">
      <div className="flex justify-center">
        <Image src="/icon.svg" alt="Paw" width={64} height={64} priority className="h-16 w-16 rounded-card-lg shadow-2" />
      </div>

      {state === "invalid-token" && (
        <Card elevation={2}>
          <EmptyState compact tone="danger" icon={<XCircle size={26} />} title="Código no válido" description="Este código QR ya no es válido. Pide al negocio el actualizado." />
        </Card>
      )}
      {state === "needs-auth" && (
        <Card elevation={2}>
          <EmptyState
            compact
            icon={<LogIn size={26} />}
            title="Inicia sesión primero"
            description="Necesitas una cuenta en Paw para vincularte."
            action={
              <Link href="/login" className="block">
                <Button full>Ir a iniciar sesión</Button>
              </Link>
            }
          />
        </Card>
      )}
      {state === "already-member" && (
        <Card elevation={2}>
          <EmptyState compact tone="info" icon={<CheckCircle size={26} />} title="Ya tienes acceso" description="Esta mascota ya está vinculada a tu cuenta." secondary={<Link href="/home">Ir al inicio</Link>} />
        </Card>
      )}
      {state === "own-pet" && (
        <Card elevation={2}>
          <EmptyState compact tone="warn" icon={<XCircle size={26} />} title="No permitido" description="No puedes vincularte a tu propia mascota." />
        </Card>
      )}
      {state === "pending" && (
        <Card elevation={2}>
          <EmptyState compact tone="warn" icon={<Clock size={26} />} title="Solicitud enviada" description="La persona dueña debe aceptarla para que tengas acceso." secondary={<Link href="/home">Ir al inicio</Link>} />
        </Card>
      )}
      {state === "error" && (
        <Card elevation={2}>
          <EmptyState compact tone="danger" icon={<XCircle size={26} />} title="Algo salió mal" description={errorMsg || "Ocurrió un error inesperado."} action={<Button full onClick={() => void load()}>Reintentar</Button>} />
        </Card>
      )}

      {state === "ready" && business && (
        <Card elevation={2} className="flex flex-col gap-4">
          <div className="text-center">
            <h1 className="font-display text-[24px] leading-tight text-on">Vincularte a {business.name}</h1>
            {business.description && <p className="mt-2 text-[14px] text-on-variant">{business.description}</p>}
          </div>

          {ownerPets.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-[13px] font-semibold text-on-variant">Elige la mascota</legend>
              <div className="flex flex-col gap-2" role="radiogroup">
                {ownerPets.map((p) => {
                  const on = selectedPetId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setSelectedPetId(p.id)}
                      className={cn(
                        "flex min-h-[56px] items-center gap-3 rounded-control border px-4 text-left transition-colors",
                        on ? "border-primary bg-primary-container text-on-primary-container" : "border-outline-variant bg-surface text-on"
                      )}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-on-variant">
                        <PawPrint size={18} aria-hidden="true" />
                      </span>
                      <span className="flex-1 text-[16px] font-bold">{p.name}</span>
                      {on && <CheckCircle size={18} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}
          {ownerPets.length === 0 && <p className="text-center text-[14px] text-on-variant">Este negocio no tiene mascotas registradas.</p>}

          <Button size="lg" full onClick={() => void handleJoin()} loading={joining} disabled={!selectedPetId}>
            Solicitar acceso
          </Button>
        </Card>
      )}
    </div>
  );
}

export default function JoinPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-8">
      <Suspense fallback={<JoinSkeleton />}>
        <JoinContent />
      </Suspense>
    </main>
  );
}
