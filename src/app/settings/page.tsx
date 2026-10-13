import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsView } from "@/components/settings/SettingsView";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase.from("users").select("google_linked").eq("id", user.id).maybeSingle();
  const googleLinked = Boolean((row as { google_linked?: boolean } | null)?.google_linked);

  return <SettingsView email={user.email ?? null} googleLinked={googleLinked} />;
}
