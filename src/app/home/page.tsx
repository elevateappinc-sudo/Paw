import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeScreen } from "@/components/home/HomeScreen";
import { HomeEmpty } from "@/components/home/HomeEmpty";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase.from("pets").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  if (!count) return <HomeEmpty />;

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  const displayName = meta.full_name || meta.name || user.email?.split("@")[0] || "Tú";

  return <HomeScreen userName={displayName} userAvatarUrl={meta.avatar_url ?? null} />;
}
