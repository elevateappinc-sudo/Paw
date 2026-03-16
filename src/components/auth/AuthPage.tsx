"use client";
import { useState } from "react";
import { useStore } from "@/store";
import { PawPrint, Eye, EyeOff } from "lucide-react";

export function AuthPage() {
  const { login, register } = useStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      if (tab === "login") {
        const r = login(email.trim(), password);
        if (!r.ok) setError(r.error ?? "Error");
      } else {
        if (!name.trim()) { setError("Ingresa tu nombre"); setLoading(false); return; }
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); setLoading(false); return; }
        if (password !== confirm) { setError("Las contraseñas no coinciden"); setLoading(false); return; }
        const r = register(name.trim(), email.trim(), password);
        if (!r.ok) setError(r.error ?? "Error");
      }
      setLoading(false);
    }, 300);
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

  const fields = tab === "login"
    ? [
        { key: "email", label: "Email", value: email, set: setEmail, type: "email", placeholder: "tu@email.com" },
        { key: "password", label: "Contraseña", value: password, set: setPassword, type: showPass ? "text" : "password", placeholder: "••••••••" },
      ]
    : [
        { key: "name", label: "Nombre", value: name, set: setName, type: "text", placeholder: "Tu nombre" },
        { key: "email", label: "Email", value: email, set: setEmail, type: "email", placeholder: "tu@email.com" },
        { key: "password", label: "Contraseña", value: password, set: setPassword, type: showPass ? "text" : "password", placeholder: "Mínimo 6 caracteres" },
        { key: "confirm", label: "Confirmar", value: confirm, set: setConfirm, type: showPass ? "text" : "password", placeholder: "Repite la contraseña" },
      ];

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
          background: "linear-gradient(145deg, #0a84ff, #0052cc)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px",
          boxShadow: "0 8px 32px rgba(10,132,255,0.35)",
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
              background: "#0a84ff", color: "#ffffff",
              fontSize: 17, fontWeight: 600, cursor: "pointer",
              opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
              fontFamily: "inherit",
            }}
          >
            {loading ? "..." : tab === "login" ? "Continuar" : "Crear cuenta"}
          </button>
        </form>
      </div>
    </div>
  );
}
