import { redirect } from "next/navigation";

/** El panel del negocio vive ahora en /negocio. */
export default function AdminBusinessPage() {
  redirect("/negocio");
}
