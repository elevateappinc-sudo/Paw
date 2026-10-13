import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPetFlow } from "@/components/pets/NewPetFlow";

export default async function NuevaMascotaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <NewPetFlow userId={user.id} />;
}
