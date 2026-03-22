"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PawPrint, Eye, EyeOff, Loader2 } from "lucide-react";

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (tab === "register") {
      if (!displayName.trim()) {
        setError("Ingresa tu nombre.");
        return;
      }
      if (password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      if (password !== confirm) {
        setError("Las contraseñas no coinciden.");
        return;
      }
    }

    setLoading(true);

    try {
      if (tab === "login") {
        const result = await signIn({ email: email.trim(), password });
        if (!result.ok) {
          setError(result.error ?? "Error al ingresar.");
        }
        // On success, AuthContext will update and page.tsx will redirect
      } else {
        const result = await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });
        if (!result.ok) {
          setError(result.error ?? "Error al crear la cuenta.");
        } else {
          setError("");
          // Show confirmation message if email confirmation is required
          // AuthContext will pick up the session automatically if auto-confirmed
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    fontSize: 17,
    color: "#ffffff",
    background: "transparent",
    border: "none",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  type FieldDef = {
    key: string;
    label: string;
    value: string;
    set: (v: string) => void;
    type: string;
    placeholder: string;
  };

  const loginFields: FieldDef[] = [
    { key: "email", label: "Email", value: email, set: setEmail, type: "email", placeholder: "tu@email.com" },
    { key: "password", label: "Contraseña", value: password, set: setPassword, type: showPass ? "text" : "password", placeholder: "••••••••" },
  ];

  const registerFields: FieldDef[] = [
    { key: "displayName", label: "Nombre", value: displayName, set: setDisplayName, type: "text", placeholder: "Tu nombre" },
    { key: "email", label: "Email", value: email, set: setEmail, type: "email", placeholder: "tu@email.com" },
    { key: "password", label: "Contraseña", value: password, set: setPassword, type: showPass ? "text" : "password", placeholder: "Mínimo 6 caracteres" },
    { key: "confirm", label: "Confirmar", value: confirm, set: setConfirm, type: showPass ? "text" : "password", placeholder: "Repite la contraseña" },
  ];

  const fields = tab === "login" ? loginFields : registerFields;

  return (
    <div style={{
      minHeight: "100dvh", background: "#000000",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "linear-gradient(145deg, var(--color-accent), #cc4a15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 8px 32px rgba(255,122,69,0.35)",
        }}>
          <PawPrint size={36} color="white" />
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: -0.5 }}>PAW</h1>
        <p style={{ fontSize: 15, color: "rgba(235,235,245,0.5)", margin: "6px 0 0" }}>
          Tu compañero de gestión animal
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Tabs */}
        <div style={{
          display: "flex", background: "rgba(120,120,128,0.24)",
          borderRadius: 10, padding: 2, marginBottom: 28,
        }}>
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }}
              style={{
                flex: 1, padding: "8px", borderRadius: 9, border: "none", cursor: "pointer",
                fontSize: 14, fontWeight: 600,
                background: tab === t ? "#ffffff" : "transparent",
                color: tab === t ? "#000000" : "rgba(235,235,245,0.6)",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
            >
              {t === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Input group */}
          <div style={{
            background: "#2c2c2e", borderRadius: 13,
            overflow: "hidden", marginBottom: 16,
          }}>
            {fields.map((f, i) => (
              <div key={f.key}>
                {i > 0 && <div style={{ height: 1, background: "rgba(84,84,88,0.65)", marginLeft: 16 }} />}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type={f.type}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    required
                    autoComplete="off"
                    disabled={loading}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {(f.key === "password" || f.key === "confirm") && (
                    <button type="button" onClick={() => setShowPass((s) => !s)}
                      style={{ padding: "0 16px", background: "none", border: "none", cursor: "pointer", color: "rgba(235,235,245,0.4)" }}>
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px", borderRadius: 10, marginBottom: 16,
              background: "rgba(255,69,58,0.15)",
              fontSize: 14, color: "#ff453a", textAlign: "center",
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            style={{
              width: "100%", padding: "16px", borderRadius: 13, border: "none",
              background: "var(--color-accent)", color: "#ffffff",
              fontSize: 17, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
              fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
            {loading
              ? (tab === "login" ? "Ingresando..." : "Creando cuenta...")
              : (tab === "login" ? "Continuar" : "Crear cuenta")}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
