"use client";
// Paw · Ajustes > Integraciones

import { CalendarIntegration } from "@/components/settings/CalendarIntegration";
import { notFound } from "next/navigation";
import { PageHeader, SectionTitle } from "@/components/ui";
import { FEATURES } from "@/lib/features";

export default function IntegrationsPage() {
  if (!FEATURES.googleCalendar) notFound();
  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="Integraciones" back backHref="/settings" />
      <section className="flex flex-col gap-3 px-4" aria-label="Google Calendar">
        <SectionTitle>Calendario</SectionTitle>
        <p className="text-body text-text-secondary">Conecta Paw con tus servicios externos.</p>
        <CalendarIntegration />
      </section>
    </div>
  );
}
