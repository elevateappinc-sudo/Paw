import { createClient } from "@supabase/supabase-js";

/**
 * Admin client with service_role key — only use server-side (API routes, migrations).
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
