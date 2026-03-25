// PAW · Settings > Integrations Page
// Sprint 3 · T003

"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CalendarIntegration } from "@/components/settings/CalendarIntegration";

export default function IntegrationsPage() {
  const router = useRouter();

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#000000",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        padding: "0 0 80px",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      {/* Navigation bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 8px",
          position: "sticky",
          top: 0,
          background: "#000000",
          zIndex: 10,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Volver"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "none",
            borderRadius: 10,
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(235,235,245,0.8)",
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 600,
            color: "rgba(235,235,245,0.9)",
            margin: 0,
            letterSpacing: "-0.3px",
          }}
        >
          Integraciones
        </h1>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 16px" }}>
        <p
          style={{
            fontSize: 14,
            color: "rgba(235,235,245,0.4)",
            margin: "0 0 24px",
          }}
        >
          Conecta PAW con tus servicios externos.
        </p>

        <section
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 18,
            padding: "20px",
          }}
        >
          <CalendarIntegration />
        </section>
      </div>
    </main>
  );
}
