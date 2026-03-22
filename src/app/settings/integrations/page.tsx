// PAW · Settings > Integrations Page
// Sprint 3 · T003

import { CalendarIntegration } from "@/components/settings/CalendarIntegration";

export const metadata = {
  title: "PAW — Integraciones",
};

export default function IntegrationsPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#000000",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        padding: "32px 16px 80px",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "rgba(235,235,245,0.9)",
            margin: 0,
            letterSpacing: "-0.5px",
          }}
        >
          Integraciones
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "rgba(235,235,245,0.4)",
            marginTop: 6,
            margin: "6px 0 0",
          }}
        >
          Conecta PAW con tus servicios externos.
        </p>
      </div>

      {/* Section */}
      <section
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 18,
          padding: "20px 20px",
        }}
      >
        <CalendarIntegration />
      </section>
    </main>
  );
}
