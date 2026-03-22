import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // PKCE flow: recommended for PWA / iOS Safari compatibility
        // Prevents code interception attacks and works with redirect mode
        flowType: "pkce",
      },
    }
  );
}
