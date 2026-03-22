import { createClient } from "@/lib/supabase/server";
import { Stethoscope } from "lucide-react";
import type { ClinicalRecord } from "@/types";

const VISIT_TYPE_LABELS: Record<string, string> = {
  consulta_general: "Consulta general",
  emergencia: "Emergencia",
  cirugia: "Cirugía",
  control_rutina: "Control rutina",
  peluqueria: "Peluquería",
  otro: "Otro",
};

function formatDate(d: string): string {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SharedHistorialPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Look up the share token
  const { data: tokenData, error: tokenError } = await supabase
    .from("share_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (tokenError || !tokenData) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🔒</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
            Este historial ya no está disponible
          </h1>
          <p style={{ fontSize: 15, color: "rgba(235,235,245,0.5)", margin: 0 }}>
            El enlace expiró o no es válido.
          </p>
        </div>
      </div>
    );
  }

  // Check expiry
  const expiresAt = new Date(tokenData.expires_at as string);
  if (expiresAt < new Date()) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          background: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>⏰</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#fff", margin: "0 0 12px" }}>
            Este historial ya no está disponible
          </h1>
          <p style={{ fontSize: 15, color: "rgba(235,235,245,0.5)", margin: 0 }}>
            El enlace de 24 horas ha expirado.
          </p>
        </div>
      </div>
    );
  }

  // Fetch pet
  const { data: pet } = await supabase
    .from("pets")
    .select("name, emoji, color")
    .eq("id", tokenData.pet_id as string)
    .single();

  // Fetch records
  const { data: records } = await supabase
    .from("clinical_records")
    .select("*")
    .eq("pet_id", tokenData.pet_id as string)
    .order("visit_date", { ascending: false });

  const petName = (pet as { name: string } | null)?.name ?? "Mascota";
  const accentColor = (pet as { color: string } | null)?.color ?? "#0a84ff";

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#000",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingBottom: 40,
      }}
    >
      {/* Header */}
      <div style={{ padding: "56px 24px 32px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "rgba(235,235,245,0.4)",
            margin: "0 0 8px",
          }}
        >
          {petName}
        </p>
        <h1
          style={{
            fontSize: 34,
            fontWeight: 700,
            color: "#fff",
            margin: 0,
            letterSpacing: -0.5,
          }}
        >
          Historial Clínico
        </h1>
        <p style={{ fontSize: 14, color: "rgba(235,235,245,0.35)", marginTop: 6, marginBottom: 0 }}>
          Solo lectura · compartido
        </p>
      </div>

      <div style={{ padding: "0 16px" }}>
        {!records || records.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              background: "#1c1c1e",
              borderRadius: 20,
            }}
          >
            <Stethoscope size={40} color="rgba(235,235,245,0.2)" />
            <p style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginTop: 16 }}>
              Sin registros clínicos
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "#1c1c1e",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {(records as ClinicalRecord[]).map((r, i) => (
              <div key={r.id}>
                {i > 0 && (
                  <div
                    style={{
                      height: 1,
                      background: "rgba(84,84,88,0.65)",
                      marginLeft: 60,
                    }}
                  />
                )}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "16px",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: `${accentColor}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Stethoscope size={20} color={accentColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: "#fff", margin: 0 }}>
                      {VISIT_TYPE_LABELS[r.visit_type] ?? r.visit_type}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: "rgba(235,235,245,0.5)",
                        margin: "2px 0 0",
                      }}
                    >
                      {formatDate(r.visit_date)}
                      {r.vet_name && ` · ${r.vet_name}`}
                      {r.clinic_name && ` · ${r.clinic_name}`}
                    </p>
                    {r.diagnosis && (
                      <p
                        style={{
                          fontSize: 14,
                          color: "rgba(235,235,245,0.65)",
                          margin: "6px 0 0",
                        }}
                      >
                        <strong style={{ color: "rgba(235,235,245,0.4)", fontSize: 11 }}>
                          DIAGNÓSTICO:
                        </strong>{" "}
                        {r.diagnosis}
                      </p>
                    )}
                    {r.treatment && (
                      <p
                        style={{
                          fontSize: 14,
                          color: "rgba(235,235,245,0.65)",
                          margin: "4px 0 0",
                        }}
                      >
                        <strong style={{ color: "rgba(235,235,245,0.4)", fontSize: 11 }}>
                          TRATAMIENTO:
                        </strong>{" "}
                        {r.treatment}
                      </p>
                    )}
                    {r.notes && (
                      <p
                        style={{
                          fontSize: 14,
                          color: "rgba(235,235,245,0.65)",
                          margin: "4px 0 0",
                        }}
                      >
                        <strong style={{ color: "rgba(235,235,245,0.4)", fontSize: 11 }}>
                          NOTAS:
                        </strong>{" "}
                        {r.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
