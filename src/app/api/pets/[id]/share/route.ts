import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEMO_COOKIE, isDemoEnv } from "@/lib/demo";

/**
 * POST /api/pets/:id/share
 * Crea un enlace de invitación de un solo uso (vence en 30 días) para
 * compartirlo por WhatsApp, mensaje de texto o donde sea. Quien lo abre
 * llega al inicio de sesión y, al entrar o registrarse, queda como co-dueño.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: petId } = await params;
  const cookieStore = await cookies();
  if (isDemoEnv() || cookieStore.get(DEMO_COOKIE)?.value === "1") {
    return NextResponse.json({ error: "En la demo no se puede compartir" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

  const { data: pet } = await supabase.from("pets").select("id, user_id").eq("id", petId).maybeSingle();
  if (!pet || pet.user_id !== user.id) return NextResponse.json({ error: "Solo quien registró la mascota puede compartirla" }, { status: 403 });

  // La RLS también exige que sea el dueño
  const { data: inv, error } = await supabase.from("pet_invitations").insert({ pet_id: petId, invited_by: user.id }).select("token").single();
  if (error || !inv) return NextResponse.json({ error: "No pudimos crear el enlace" }, { status: 500 });

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_URL || new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/invitacion/${inv.token}` });
}
