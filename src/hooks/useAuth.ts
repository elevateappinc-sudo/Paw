import { createClient } from "@/lib/supabase/client";
import type { AuthError, Session, User } from "@supabase/supabase-js";

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: User | null;
  session?: Session | null;
}

function mapAuthError(error: AuthError): string {
  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials") || msg.includes("invalid credentials")) {
    return "Email o contraseña incorrectos. Intenta de nuevo.";
  }
  if (msg.includes("email not confirmed")) {
    return "Revisa tu correo para confirmar tu cuenta antes de ingresar.";
  }
  if (msg.includes("too many requests") || msg.includes("rate limit")) {
    return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
  }
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
    return "Sin conexión. Verifica tu internet e intenta de nuevo.";
  }
  if (msg.includes("user already registered") || msg.includes("already been registered")) {
    return "Este email ya tiene una cuenta. ¿Olvidaste tu contraseña?";
  }

  return error.message;
}

function mapOAuthError(error: AuthError | null, errorParam?: string | null): string {
  if (!error && !errorParam) return "";

  const msg = error?.message?.toLowerCase() ?? errorParam?.toLowerCase() ?? "";

  if (msg.includes("already registered") || msg.includes("email already") || msg.includes("user already")) {
    return "Ya tienes una cuenta con email y contraseña. Inicia sesión normal y luego vincula Google desde tu perfil.";
  }
  if (msg.includes("email_verified") || msg.includes("not verified")) {
    return "No pudimos verificar tu correo de Google. Por favor usa otro método de inicio de sesión.";
  }
  if (msg.includes("email") && msg.includes("coincide")) {
    return "Tu cuenta está registrada con otro email. Usa ese email para ingresar.";
  }
  if (msg === "oauth_failed" || msg.includes("oauth")) {
    return "No pudimos conectar con Google. Intenta de nuevo.";
  }

  return "No pudimos conectar con Google. Intenta de nuevo.";
}

export function useAuth() {
  const supabase = createClient();

  async function signUp({ email, password, displayName }: SignUpParams): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: displayName },
        },
      });

      if (error) return { ok: false, error: mapAuthError(error) };
      return { ok: true, user: data.user, session: data.session };
    } catch {
      return { ok: false, error: "Sin conexión. Verifica tu internet e intenta de nuevo." };
    }
  }

  async function signIn({ email, password }: SignInParams): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { ok: false, error: mapAuthError(error) };
      return { ok: true, user: data.user, session: data.session };
    } catch {
      return { ok: false, error: "Sin conexión. Verifica tu internet e intenta de nuevo." };
    }
  }

  async function signInWithGoogle(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        return { ok: false, error: mapOAuthError(error) };
      }

      // OAuth redirects the user — no session available here yet
      return { ok: true };
    } catch (err) {
      // User cancelled or popup blocked — silently return without error
      const message = err instanceof Error ? err.message.toLowerCase() : "";
      if (message.includes("cancelled") || message.includes("closed") || message.includes("popup")) {
        return { ok: true }; // Treated as cancellation — no visible error
      }
      return { ok: false, error: "No pudimos conectar con Google. Intenta de nuevo." };
    }
  }

  async function linkGoogleAccount(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("already linked") || msg.includes("already exists")) {
          return { ok: false, error: "Esta cuenta de Google ya está vinculada a otro usuario." };
        }
        return { ok: false, error: mapOAuthError(error) };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: "No pudimos conectar con Google. Intenta de nuevo." };
    }
  }

  async function signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch {
      return { ok: false, error: "Sin conexión. Verifica tu internet e intenta de nuevo." };
    }
  }

  async function getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  return { signUp, signIn, signInWithGoogle, linkGoogleAccount, signOut, getSession };
}
