"use client";
import { useCallback, useEffect, useState } from "react";
import { Building2, BadgeCheck } from "lucide-react";
import { Button, EmptyState, PageHeader, Sheet, Skeleton, Tabs, Tag, Verified, showToast } from "@/components/ui";
import { BusinessPlanSelector } from "@/components/marketplace/BusinessPlanSelector";
import { useAuthContext } from "@/contexts/AuthContext";
import { fetchMyBusiness } from "@/lib/api/businesses";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { BUSINESS_CATEGORY_LABEL, type Business } from "@/types/db";
import { BusinessForm } from "./BusinessForm";
import { AgendaTab } from "./AgendaTab";
import { ClientesTab } from "./ClientesTab";
import { ResenasTab } from "./ResenasTab";
import { ServiciosTab } from "./ServiciosTab";
import { PerfilTab } from "./PerfilTab";
import { changePlan, fetchPlan, PLAN_LABEL, type PlanName } from "./negocioData";

type TabKey = "agenda" | "clientes" | "resenas" | "servicios" | "perfil";
const TABS: { value: TabKey; label: string }[] = [
  { value: "agenda", label: "Agenda" },
  { value: "clientes", label: "Clientes" },
  { value: "resenas", label: "Reseñas" },
  { value: "servicios", label: "Servicios" },
  { value: "perfil", label: "Perfil" },
];

function Shell({ children, title, eyebrow }: { children: React.ReactNode; title: string; eyebrow?: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg pb-[max(24px,env(safe-area-inset-bottom))]">
      <PageHeader title={title} eyebrow={eyebrow} back backHref="/home" />
      {children}
    </div>
  );
}

export function NegocioScreen() {
  const { user, loading: authLoading } = useAuthContext();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<PlanName>("free");
  const [planOpen, setPlanOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("agenda");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const b = await fetchMyBusiness(user.id);
      setBusiness(b);
      if (b) setPlan(await fetchPlan(b.id));
    } catch (e) {
      if (isMissingSchema(e)) {
        setBusiness(null);
        showToast("El directorio de negocios aún no está disponible");
      } else setError("No pudimos cargar tu negocio");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) void load();
  }, [authLoading, load]);

  async function selectPlan(name: string) {
    if (!business) return;
    const next = (name === "pro" || name === "business" ? name : "free") as PlanName;
    try {
      await changePlan(business.id, next);
      setPlan(next);
      setPlanOpen(false);
      showToast(`Ahora tienes el ${PLAN_LABEL[next]}`, undefined, "success");
    } catch (e) {
      showToast(isMissingSchema(e) ? "Los planes aún no están disponibles" : "No pudimos cambiar el plan", undefined, "error");
    }
  }

  if (authLoading || (loading && !business)) {
    return (
      <Shell title="Mi negocio">
        <div className="delay-in flex flex-col gap-3 px-4" aria-busy="true">
          <Skeleton className="h-[72px] rounded-md" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-[76px] rounded-md" />
          <Skeleton className="h-[200px] rounded-md" />
        </div>
      </Shell>
    );
  }

  if (!user) {
    return (
      <Shell title="Mi negocio">
        <EmptyState title="Inicia sesión" description="Necesitas una cuenta para administrar tu negocio." action={<Button full onClick={() => (window.location.href = "/login")}>Ir a iniciar sesión</Button>} />
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell title="Mi negocio">
        <EmptyState title="Algo salió mal" description={error} action={<Button full onClick={load}>Reintentar</Button>} />
      </Shell>
    );
  }

  if (!business) {
    return (
      <Shell title="Mi negocio" eyebrow="Registro">
        <div className="px-4">
          <BusinessForm initial={null} userId={user.id} mode="create" onSaved={(b) => { setBusiness(b); setTab("agenda"); }} />
        </div>
      </Shell>
    );
  }

  return (
    <Shell title={business.name} eyebrow={BUSINESS_CATEGORY_LABEL[business.type]}>
      <div className="flex items-center gap-3 px-4 pb-3">
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.logo_url} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text"><Building2 size={26} aria-hidden="true" /></span>
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Tag tone={plan === "free" ? "neutral" : "primary"}>{PLAN_LABEL[plan]}</Tag>
          {business.verified && <Verified />}
          {business.emergency_24h && <Tag tone="danger" size="xs">24 h</Tag>}
          <button type="button" onClick={() => setPlanOpen(true)} className="inline-flex min-h-11 items-center gap-1 text-small font-semibold text-primary-text">
            <BadgeCheck size={14} aria-hidden="true" /> Cambiar plan
          </button>
        </div>
      </div>

      <Tabs options={TABS} value={tab} onChange={setTab} ariaLabel="Secciones del negocio" className="px-2" />

      <div className="px-4 pt-4">
        {tab === "agenda" && <AgendaTab business={business} />}
        {tab === "clientes" && <ClientesTab business={business} />}
        {tab === "resenas" && <ResenasTab business={business} />}
        {tab === "servicios" && <ServiciosTab business={business} />}
        {tab === "perfil" && <PerfilTab business={business} userId={user.id} plan={plan} onSaved={setBusiness} onChangePlan={() => setPlanOpen(true)} />}
      </div>

      <Sheet open={planOpen} onClose={() => setPlanOpen(false)} title="Planes" subtitle="Elige el que mejor se adapte a tu negocio" maxHeight="92dvh">
        <BusinessPlanSelector currentPlan={plan} onSelect={(name) => void selectPlan(name)} />
      </Sheet>
    </Shell>
  );
}
