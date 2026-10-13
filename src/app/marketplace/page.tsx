import { redirect } from "next/navigation";

/** El marketplace de anuncios se sustituye por el directorio Explorar. */
export default function MarketplacePage() {
  redirect("/explorar");
}
