"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PawPrint, Eye, EyeOff, Loader2, Mail } from "lucide-react";

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

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
        } else {
          router.push('/home');
        }
      } else {
        const result = await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        });
        if (!result.ok) {
          setError(result.error ?? "Error al crear la cuenta.");
        } else if (!result.session) {
          // Signup exitoso pero requiere confirmación de email
          setSuccessMessage(`¡Cuenta creada! Revisa tu bandeja de entrada en ${email.trim()} y confirma tu correo para ingresar. Si no lo ves, revisa la carpeta de spam.`);
        } else if (result.session) {
          router.push('/home');
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

  // Si el registro fue exitoso y esperamos confirmación, mostrar pantalla de éxito
  if (successMessage) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#000000",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
      }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(145deg, #22C55E, #16a34a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(34,197,94,0.35)",
          }}>
            <Mail size={36} color="white" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", margin: "0 0 12px" }}>
            Revisa tu correo
          </h1>
          <p style={{ fontSize: 15, color: "rgba(235,235,245,0.7)", lineHeight: 1.6, margin: "0 0 32px" }}>
            {successMessage}
          </p>
          <button
            onClick={() => { setSuccessMessage(""); setTab("login"); setPassword(""); setConfirm(""); }}
            style={{
              padding: "14px 32px", borderRadius: 13, border: "none",
              background: "var(--color-accent)", color: "#ffffff",
              fontSize: 16, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Ya confirmé mi correo
          </button>
          <p style={{ marginTop: 16, fontSize: 13, color: "rgba(235,235,245,0.4)" }}>
            ¿No llegó el correo?{" "}
            <button
              onClick={() => setSuccessMessage("")}
              style={{ background: "none", border: "none", color: "var(--color-accent)", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
            >
              Intentar de nuevo
            </button>
          </p>
        </div>
      </div>
    );
  }

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
        {/* Google Sign-In */}
        <button
          type="button"
          onClick={async () => {
            setGoogleLoading(true);
            const result = await signInWithGoogle();
            if (!result.ok) setError(result.error ?? 'Error al iniciar sesión con Google.');
            setGoogleLoading(false);
          }}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 13,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: '#ffffff',
            fontSize: 16,
            fontWeight: 600,
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            opacity: googleLoading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 20,
            fontFamily: 'inherit',
            transition: 'background 0.2s',
          }}
        >
          {googleLoading ? (
            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        {/* Separador */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 13, color: 'rgba(235,235,245,0.4)', whiteSpace: 'nowrap' }}>o continúa con email</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", background: "rgba(120,120,128,0.24)",
          borderRadius: 10, padding: 2, marginBottom: 28,
        }}>
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); setSuccessMessage(""); }}
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
