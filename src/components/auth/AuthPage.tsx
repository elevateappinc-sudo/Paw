"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PawPrint, Eye, EyeOff, Loader2 } from "lucide-react";

// Google "G" SVG icon
function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Handle OAuth error returned via redirect query param
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("auth_error");
    if (authError) {
      setError(mapRedirectError(authError));
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  function mapRedirectError(code: string): string {
    switch (code) {
      case "oauth_failed":
        return "No pudimos conectar con Google. Intenta de nuevo.";
      case "email_not_verified":
        return "No pudimos verificar tu correo de Google. Por favor usa otro método de inicio de sesión.";
      case "email_conflict":
        return "Ya tienes una cuenta con email y contraseña. Inicia sesión normal y luego vincula Google desde tu perfil.";
      default:
        return "No pudimos conectar con Google. Intenta de nuevo.";
    }
  }

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
          // AuthContext will pick up the session automatically if auto-confirmed
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (!result.ok) {
        setError(result.error ?? "No pudimos conectar con Google. Intenta de nuevo.");
      }
      // On success: OAuth redirects the browser — no further action needed here
    } finally {
      setGoogleLoading(false);
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
  const isAnyLoading = loading || googleLoading;

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
                    disabled={isAnyLoading}
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
          <button type="submit" disabled={isAnyLoading}
            style={{
              width: "100%", padding: "16px", borderRadius: 13, border: "none",
              background: "#0a84ff", color: "#ffffff",
              fontSize: 17, fontWeight: 600, cursor: isAnyLoading ? "not-allowed" : "pointer",
              opacity: isAnyLoading ? 0.7 : 1, transition: "opacity 0.2s",
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

        {/* Separator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
        }}>
          <div style={{ flex: 1, height: 1, background: "rgba(84,84,88,0.65)" }} />
          <span style={{ fontSize: 13, color: "rgba(235,235,245,0.4)", flexShrink: 0 }}>o</span>
          <div style={{ flex: 1, height: 1, background: "rgba(84,84,88,0.65)" }} />
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isAnyLoading}
          style={{
            width: "100%", padding: "15px 16px", borderRadius: 13,
            background: "#111111", border: "1px solid #333333",
            color: "#ffffff", fontSize: 16, fontWeight: 600,
            cursor: isAnyLoading ? "not-allowed" : "pointer",
            opacity: isAnyLoading ? 0.7 : 1, transition: "opacity 0.2s",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          {googleLoading
            ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            : <GoogleIcon size={20} />
          }
          {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
        </button>
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
