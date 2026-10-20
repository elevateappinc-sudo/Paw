"use client";
import { BellRing } from "lucide-react";
import { Button, Card, Tag } from "@/components/ui";
import type { Business } from "@/types/db";
import { BusinessForm } from "./BusinessForm";
import type { PlanName } from "./negocioData";

export function PerfilTab({ business, userId, plan, onSaved, onChangePlan }: { business: Business; userId: string; plan: PlanName; onSaved: (b: Business) => void; onChangePlan: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Card tone="info" elevation={0}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-surface text-info-text"><BellRing size={22} aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-subtitle leading-tight">Recordatorios a clientes</div>
              <Tag tone="info" size="xs">Plan Pro</Tag>
            </div>
            <p className="mt-1 text-small">
              Paw avisa a los dueños cuando a su mascota le toca el baño, la vacuna o la desparasitación, y les ofrece tu agenda para reservar en un toque.
            </p>
            {plan === "free" && (
              <Button size="sm" variant="primary" className="mt-3" onClick={onChangePlan}>
                Ver planes
              </Button>
            )}
            {plan !== "free" && <p className="mt-2 text-small font-semibold">Activo en tu plan</p>}
          </div>
        </div>
      </Card>
      <BusinessForm initial={business} userId={userId} mode="edit" onSaved={onSaved} />
    </div>
  );
}
