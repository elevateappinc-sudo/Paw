import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_COOKIE, isDemoEnv } from "@/lib/demo";

/** Buckets donde la app guarda archivos bajo `<user_id>/...` */
const BUCKETS = ["pet-photos", "paw-photos", "pet-videos", "clinical-docs"];

/** Rutas de todos los archivos bajo un prefijo (Storage lista un nivel a la vez) */
async function listFiles(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (error || !data?.length) break;
    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      // Las carpetas no tienen id
      if (item.id) out.push(path);
      else out.push(...(await listFiles(admin, bucket, path)));
    }
    if (data.length < 1000) break;
  }
  return out;
}

/**
 * DELETE /api/account — elimina la cuenta del usuario autenticado y toda su
 * información: archivos en Storage, eventos que creó, su perfil (public.users,
 * con ON DELETE CASCADE hacia todas sus tablas, mascotas incluidas) y por
 * último el usuario de Auth.
 */
export async function DELETE() {
  const cookieStore = await cookies();
  if (isDemoEnv() || cookieStore.get(DEMO_COOKIE)?.value === "1") {
    return NextResponse.json({ error: "En la demo no hay una cuenta que eliminar" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Eliminar la cuenta no está disponible en este momento" }, { status: 500 });
  }
  const admin = createAdminClient();

  // 1. Archivos: no tienen clave foránea, se borran a mano
  for (const bucket of BUCKETS) {
    const files = await listFiles(admin, bucket, user.id);
    for (let i = 0; i < files.length; i += 100) {
      const { error } = await admin.storage.from(bucket).remove(files.slice(i, i + 100));
      if (error) return NextResponse.json({ error: "No pudimos borrar tus archivos; intenta de nuevo" }, { status: 500 });
    }
  }

  // 2. Eventos que creó (su clave foránea es SET NULL y quedarían huérfanos)
  const { error: eventsError } = await admin.from("events").delete().eq("created_by", user.id);
  if (eventsError) return NextResponse.json({ error: "No pudimos borrar tus eventos; intenta de nuevo" }, { status: 500 });

  // 3. Perfil con la llave de servicio: la cascada borra mascotas y todas las
  //    tablas del usuario. Se hace aquí y no desde Auth porque el rol de Auth
  //    no puede ejecutar triggers que actualizan otras tablas (peso de la
  //    mascota, calificación de negocios) y el borrado fallaba.
  const { error: profileError } = await admin.from("users").delete().eq("id", user.id);
  if (profileError) return NextResponse.json({ error: "No pudimos borrar tus datos; intenta de nuevo" }, { status: 500 });

  // 4. Usuario de Auth (ya sin datos que dependan de él)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "No pudimos eliminar la cuenta; intenta de nuevo" }, { status: 500 });

  await supabase.auth.signOut().catch(() => {});
  return NextResponse.json({ ok: true });
}
