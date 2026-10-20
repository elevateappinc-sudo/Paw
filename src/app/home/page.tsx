import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomeScreen } from "@/components/home/HomeScreen";
import { HomeEmpty } from "@/components/home/HomeEmpty";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { count } = await supabase.from("pets").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  // Suspense: HomeScreen y HomeEmpty leen ?registrar=1 (FAB "Registrar") con useSearchParams
  if (!count) {
    return (
      <Suspense fallback={null}>
        <HomeEmpty />
      </Suspense>
    );
  }

  const meta = (user.user_metadata ?? {}) as { full_name?: string; name?: string; avatar_url?: string };
  const displayName = meta.full_name || meta.name || user.email?.split("@")[0] || "Tú";

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeScreen userId={user.id} userName={displayName} userAvatarUrl={meta.avatar_url ?? null} />
    </Suspense>
  );
}
