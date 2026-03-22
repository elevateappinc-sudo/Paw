// PAW · Google Calendar OAuth — Callback Handler
// Sprint 3 · T002

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALENDAR_ENCRYPTION_KEY = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY!;
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3004";
const REDIRECT_URI = `${NEXT_PUBLIC_URL}/auth/google-calendar/callback`;

async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return res.json();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const cookieStore = await cookies();

  // User denied access
  if (errorParam === "access_denied") {
    return NextResponse.redirect(`${NEXT_PUBLIC_URL}/settings/integrations?gcal=denied`);
  }

  // CSRF check
  const savedState = cookieStore.get("gcal_oauth_state")?.value;
  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${NEXT_PUBLIC_URL}/settings/integrations?gcal=error&reason=csrf`);
  }

  if (!code) {
    return NextResponse.redirect(`${NEXT_PUBLIC_URL}/settings/integrations?gcal=error&reason=no_code`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Route Handler
          }
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.redirect(`${NEXT_PUBLIC_URL}/?auth_error=unauthenticated`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Use Supabase service role to encrypt tokens via pgcrypto pgp_sym_encrypt
    // We store the encryption in the DB itself so the key never touches the client
    const serviceSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    // Encrypt tokens using pgp_sym_encrypt via a raw SQL query
    const { data: encryptedData, error: encryptError } = await serviceSupabase.rpc(
      "encrypt_calendar_tokens",
      {
        p_access_token: tokens.access_token,
        p_refresh_token: tokens.refresh_token,
        p_key: GOOGLE_CALENDAR_ENCRYPTION_KEY,
      }
    );

    if (encryptError || !encryptedData?.encrypted_access) {
      console.error("Encrypt RPC error — tokens will NOT be stored in plaintext:", encryptError);
      return NextResponse.redirect(
        `${origin}/settings/integrations?error=encryption_failed`
      );
    }

    const accessTokenStored = encryptedData.encrypted_access;
    const refreshTokenStored = encryptedData.encrypted_refresh;

    // Upsert calendar_integrations
    const { error: upsertError } = await serviceSupabase
      .from("calendar_integrations")
      .upsert(
        {
          user_id: user.id,
          access_token: accessTokenStored,
          refresh_token: refreshTokenStored,
          token_expires_at: tokenExpiresAt,
          gcal_calendar_id: "primary",
          sync_enabled: true,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Upsert calendar_integrations error:", upsertError);
      return NextResponse.redirect(
        `${NEXT_PUBLIC_URL}/settings/integrations?gcal=error&reason=db`
      );
    }

    // Clear state cookie
    const response = NextResponse.redirect(
      `${NEXT_PUBLIC_URL}/settings/integrations?gcal=connected`
    );
    response.cookies.set("gcal_oauth_state", "", { maxAge: 0, path: "/" });
    return response;
  } catch (err) {
    console.error("Google Calendar OAuth callback error:", err);
    return NextResponse.redirect(
      `${NEXT_PUBLIC_URL}/settings/integrations?gcal=error&reason=token_exchange`
    );
  }
}
