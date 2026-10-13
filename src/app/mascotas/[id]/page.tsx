import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PetProfileScreen } from "@/components/pets/profile/PetProfileScreen";

export default async function MascotaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <PetProfileScreen petId={id} userId={user.id} />;
}
