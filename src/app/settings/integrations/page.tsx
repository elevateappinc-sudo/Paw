"use client";
// Paw · Ajustes > Integraciones

import { CalendarIntegration } from "@/components/settings/CalendarIntegration";
import { PageHeader, SectionTitle } from "@/components/ui";

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="Integraciones" back backHref="/settings" />
      <section className="flex flex-col gap-3 px-4" aria-label="Google Calendar">
        <SectionTitle>Calendario</SectionTitle>
        <p className="text-[14px] text-on-variant">Conecta Paw con tus servicios externos.</p>
        <CalendarIntegration />
      </section>
    </div>
  );
}
