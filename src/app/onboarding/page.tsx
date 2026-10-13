import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPetFlow } from "@/components/pets/NewPetFlow";

/** Usuarios nuevos: el alta de la primera mascota es el onboarding. */
export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <NewPetFlow userId={user.id} mode="onboarding" />;
}
