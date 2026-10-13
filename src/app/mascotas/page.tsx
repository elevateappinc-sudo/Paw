import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PetsScreen } from "@/components/pets/PetsScreen";

export default async function MascotasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <PetsScreen />;
}
