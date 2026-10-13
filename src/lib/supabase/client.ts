import { createBrowserClient } from "@supabase/ssr";
import { isDemoClient } from "@/lib/demo";
import { createDemoClient } from "@/lib/demo/client";

let demoClient: ReturnType<typeof createDemoClient> | null = null;

export function createClient() {
  if (isDemoClient()) {
    if (!demoClient) demoClient = createDemoClient();
    return demoClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During SSR/build without env vars, return a dummy client that won't crash
    if (typeof window === "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { from: () => ({ select: () => Promise.resolve({ data: [], error: null }) }) } as any;
    }
    throw new Error(`Missing Supabase env vars. URL: ${url ? "ok" : "missing"}, KEY: ${key ? "ok" : "missing"}`);
  }

  return createBrowserClient(url, key);
}
