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

  async function linkGoogleAccount(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?link=google`,
        },
      });
      if (error) return { ok: false, error: mapAuthError(error) };
      return { ok: true };
    } catch {
      return { ok: false, error: "Sin conexión. Verifica tu internet e intenta de nuevo." };
    }
  }

  async function signInWithGoogle(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) return { ok: false, error: mapAuthError(error) };
      return { ok: true }; // el browser redirige, esto rara vez llega
    } catch {
      return { ok: false, error: 'Sin conexión. Verifica tu internet e intenta de nuevo.' };
    }
  }

  return { signUp, signIn, signOut, getSession, linkGoogleAccount, signInWithGoogle };
}
