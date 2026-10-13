"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Input, SegmentedControl } from "@/components/ui";
import { GoogleLogo } from "@/components/settings/GoogleLogo";

type Tab = "login" | "register";

export function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("login");
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
        setError("Escribe tu nombre.");
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
        if (!result.ok) setError(result.error ?? "No pudimos iniciar sesión.");
        else router.push("/home");
      } else {
        const result = await signUp({ email: email.trim(), password, displayName: displayName.trim() });
        if (!result.ok) {
          setError(result.error ?? "No pudimos crear la cuenta.");
        } else if (!result.session) {
          setSuccessMessage(`Revisa tu bandeja de entrada en ${email.trim()} y confirma tu correo para entrar. Si no lo ves, mira en la carpeta de spam.`);
        } else {
          router.push("/home");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const result = await signInWithGoogle();
    if (!result.ok) setError(result.error ?? "No pudimos iniciar sesión con Google.");
    setGoogleLoading(false);
  }

  const passwordToggle = (
    <button type="button" onClick={() => setShowPass((s) => !s)} aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"} className="flex h-9 w-9 items-center justify-center rounded-full text-on-variant active:scale-95">
      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  if (successMessage) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-8">
        <Card className="w-full max-w-[400px] text-center" elevation={2}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ok-container text-ok">
            <Mail size={30} aria-hidden="true" />
          </div>
          <h1 className="font-display text-[26px] leading-tight text-on">Revisa tu correo</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-on-variant">{successMessage}</p>
          <Button
            full
            size="lg"
            className="mt-6"
            onClick={() => {
              setSuccessMessage("");
              setTab("login");
              setPassword("");
              setConfirm("");
            }}
          >
            Ya confirmé mi correo
          </Button>
          <p className="mt-4 text-[13px] text-on-variant">
            ¿No llegó el correo?{" "}
            <button type="button" onClick={() => setSuccessMessage("")} className="font-bold text-primary">
              Intentar de nuevo
            </button>
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-8">
      <motion.div className="flex w-full max-w-[400px] flex-col gap-6" variants={reduce ? undefined : stagger(0.06)} initial={reduce ? false : "hidden"} animate="show">
        <motion.div className="flex flex-col items-center text-center" variants={fadeUp}>
          <Image src="/icon.svg" alt="" width={80} height={80} priority className="mb-4 h-20 w-20 rounded-card-lg shadow-2" />
          <h1 className="font-display text-[36px] leading-none text-on">Paw</h1>
          <p className="mt-2 text-[15px] text-on-variant">Todo lo que tu mascota necesita, cerca de ti.</p>
        </motion.div>

        <motion.div className="flex flex-col gap-4" variants={fadeUp}>
          <Button size="lg" full onClick={() => void handleGoogle()} loading={googleLoading} leading={<GoogleLogo size={18} />}>
            Continuar con Google
          </Button>

          <div className="flex items-center gap-3" role="separator" aria-label="o continúa con correo">
            <span className="h-px flex-1 bg-outline-variant" />
            <span className="text-[13px] text-on-variant">o continúa con correo</span>
            <span className="h-px flex-1 bg-outline-variant" />
          </div>

          <SegmentedControl<Tab>
            ariaLabel="Entrar o crear cuenta"
            value={tab}
            onChange={(t) => {
              setTab(t);
              setError("");
              setSuccessMessage("");
            }}
            options={[
              { value: "login", label: "Iniciar sesión" },
              { value: "register", label: "Crear cuenta" },
            ]}
          />
        </motion.div>

        <motion.form onSubmit={handleSubmit} className="flex flex-col gap-3" variants={fadeUp} noValidate>
          {tab === "register" && <Input label="Nombre" type="text" autoComplete="name" required placeholder="Tu nombre" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={loading} />}
          <Input label="Correo" type="email" inputMode="email" autoComplete="email" required placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
          <Input
            label="Contraseña"
            type={showPass ? "text" : "password"}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            required
            placeholder={tab === "login" ? "Tu contraseña" : "Mínimo 6 caracteres"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            trailing={passwordToggle}
          />
          {tab === "register" && (
            <Input
              label="Confirmar contraseña"
              type={showPass ? "text" : "password"}
              autoComplete="new-password"
              required
              placeholder="Repite la contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
            />
          )}

          {error && (
            <Card tone="danger" elevation={0} role="alert" className="py-3 text-center text-[14px] font-semibold">
              {error}
            </Card>
          )}

          <Button type="submit" size="lg" full variant="tonal" loading={loading} className="mt-1">
            {tab === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </motion.form>

        <motion.div variants={fadeUp} className="flex flex-col items-center gap-1 pt-2 text-center">
          <a href="/demo" className="inline-flex min-h-[44px] items-center justify-center rounded-full px-4 text-[15px] font-bold text-primary">
            Ver la demo con datos de ejemplo
          </a>
          <span className="text-[12px] text-on-variant">Sin cuenta. Mascotas, negocios y citas ficticios.</span>
        </motion.div>
      </motion.div>
    </main>
  );
}
