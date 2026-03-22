"use client";

interface Plan {
  name: string;
  label: string;
  price: string;
  emoji: string;
  color: string;
  features: { label: string; value: string | boolean }[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    name: "free",
    label: "Free",
    price: "Gratis",
    emoji: "🐾",
    color: "rgba(255,255,255,0.2)",
    features: [
      { label: "Listados activos", value: "1" },
      { label: "Imágenes por listado", value: "3" },
      { label: "Comisión por venta", value: "8%" },
      { label: "Analytics", value: false },
      { label: "Listados destacados", value: false },
      { label: "Badge verificado", value: false },
    ],
    cta: "Plan actual",
  },
  {
    name: "pro",
    label: "Pro",
    price: "$29.99/mes",
    emoji: "⭐",
    color: "#0a84ff",
    features: [
      { label: "Listados activos", value: "Ilimitados" },
      { label: "Imágenes por listado", value: "5" },
      { label: "Comisión por venta", value: "3%" },
      { label: "Analytics", value: true },
      { label: "Listados destacados", value: false },
      { label: "Badge verificado ✅", value: true },
    ],
    cta: "Actualizar a Pro",
  },
  {
    name: "business",
    label: "Business",
    price: "$79.99/mes",
    emoji: "🏆",
    color: "#ff9500",
    features: [
      { label: "Listados activos", value: "Ilimitados" },
      { label: "Imágenes por listado", value: "5" },
      { label: "Comisión por venta", value: "0%" },
      { label: "Analytics avanzados", value: true },
      { label: "Listados destacados ⭐", value: true },
      { label: "Badge verificado ✅", value: true },
    ],
    cta: "Actualizar a Business",
  },
];

interface BusinessPlanSelectorProps {
  currentPlan?: string;
  onSelect?: (planName: string) => void;
}

export function BusinessPlanSelector({ currentPlan = "free", onSelect }: BusinessPlanSelectorProps) {
  return (
    <div style={{ padding: "24px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "rgba(235,235,245,0.95)", marginBottom: 6 }}>
          Planes del Marketplace
        </div>
        <div style={{ fontSize: 14, color: "rgba(235,235,245,0.4)" }}>
          Elige el plan que mejor se adapte a tu negocio
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.name;
          return (
            <div key={plan.name} style={{
              background: "#111",
              borderRadius: 18,
              border: `1.5px solid ${isCurrent ? plan.color : "rgba(255,255,255,0.08)"}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}>
              {/* Header */}
              <div style={{
                padding: "20px 20px 16px",
                background: isCurrent ? `${plan.color}15` : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{plan.emoji}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: plan.color }}>{plan.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(235,235,245,0.95)", marginTop: 4 }}>
                  {plan.price}
                </div>
              </div>

              {/* Features */}
              <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "rgba(235,235,245,0.55)" }}>{f.label}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700,
                      color: f.value === false ? "rgba(235,235,245,0.25)" : f.value === true ? "#30d158" : "rgba(235,235,245,0.85)",
                    }}>
                      {f.value === true ? "✓" : f.value === false ? "—" : String(f.value)}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ padding: "0 20px 20px" }}>
                <button
                  onClick={() => !isCurrent && onSelect?.(plan.name)}
                  disabled={isCurrent}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: 12,
                    border: "none",
                    cursor: isCurrent ? "default" : "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    background: isCurrent ? "rgba(255,255,255,0.06)" : plan.color,
                    color: isCurrent ? "rgba(235,235,245,0.35)" : plan.name === "free" ? "white" : "#000",
                    transition: "opacity 0.15s",
                  }}
                >
                  {isCurrent ? "Plan actual" : plan.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, textAlign: "center", fontSize: 12, color: "rgba(235,235,245,0.25)" }}>
        * Las comisiones aplican cuando el switch de comisiones está habilitado por el administrador.
      </div>
    </div>
  );
}
