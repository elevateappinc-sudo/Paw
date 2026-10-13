"use client";
import { Check, Minus, PawPrint, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  label: string;
  price: string;
  icon: React.ReactNode;
  tone: "neutral" | "info" | "primary";
  features: { label: string; value: string | boolean }[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: "free",
    label: "Free",
    price: "Gratis",
    icon: <PawPrint size={22} />,
    tone: "neutral",
    features: [
      { label: "Aparece en Explorar", value: true },
      { label: "Fotos del negocio", value: "3" },
      { label: "Reservas desde Paw", value: true },
      { label: "Recordatorios a clientes", value: false },
      { label: "Destacado en el mapa", value: false },
      { label: "Analítica", value: false },
    ],
    cta: "Plan actual",
  },
  {
    name: "pro",
    label: "Pro",
    price: "$ 119 000/mes",
    icon: <Star size={22} />,
    tone: "info",
    features: [
      { label: "Aparece en Explorar", value: true },
      { label: "Fotos del negocio", value: "10" },
      { label: "Reservas desde Paw", value: true },
      { label: "Recordatorios a clientes", value: true },
      { label: "Destacado en el mapa", value: false },
      { label: "Analítica", value: true },
    ],
    cta: "Pasar a Pro",
  },
  {
    name: "business",
    label: "Business",
    price: "$ 299 000/mes",
    icon: <Trophy size={22} />,
    tone: "primary",
    features: [
      { label: "Aparece en Explorar", value: true },
      { label: "Fotos del negocio", value: "Ilimitadas" },
      { label: "Reservas desde Paw", value: true },
      { label: "Recordatorios a clientes", value: true },
      { label: "Destacado en el mapa", value: true },
      { label: "Analítica avanzada", value: true },
    ],
    cta: "Pasar a Business",
  },
];

const toneHead: Record<Plan["tone"], string> = {
  neutral: "bg-surface-2 text-on",
  info: "bg-info-container text-on-info-container",
  primary: "bg-primary-container text-on-primary-container",
};

interface BusinessPlanSelectorProps {
  currentPlan?: string;
  onSelect?: (planName: string) => void;
}

export function BusinessPlanSelector({ currentPlan = "free", onSelect }: BusinessPlanSelectorProps) {
  return (
    <div className="flex flex-col gap-4 py-2">
      <div className="text-center">
        <h3 className="font-display text-[22px] text-on">Planes para negocios</h3>
        <p className="mt-1 text-[14px] text-on-variant">Elige el que mejor se adapte a tu negocio</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.name;
          return (
            <div key={plan.name} className={cn("flex flex-col overflow-hidden rounded-card-lg border bg-surface", isCurrent ? "border-primary" : "border-outline-variant")}>
              <div className={cn("flex flex-col gap-1 px-4 py-4", toneHead[plan.tone])}>
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <span className="font-display text-[18px]">{plan.label}</span>
                </div>
                <div className="text-[20px] font-extrabold">{plan.price}</div>
              </div>
              <ul className="flex flex-1 flex-col gap-2 px-4 py-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-on-variant">{f.label}</span>
                    <span className={cn("inline-flex items-center font-bold", f.value === false ? "text-outline" : f.value === true ? "text-ok" : "text-on")}>
                      {f.value === true ? <Check size={16} aria-label="Incluido" /> : f.value === false ? <Minus size={16} aria-label="No incluido" /> : String(f.value)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-4 pb-4">
                <Button full variant={isCurrent ? "secondary" : plan.tone === "primary" ? "primary" : "tonal"} disabled={isCurrent} onClick={() => !isCurrent && onSelect?.(plan.name)}>
                  {isCurrent ? "Plan actual" : plan.cta}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-[12px] text-on-variant">Precios en pesos colombianos. Cambia o cancela cuando quieras.</p>
    </div>
  );
}
