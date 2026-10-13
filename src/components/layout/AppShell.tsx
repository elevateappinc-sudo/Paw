"use client";
import { usePathname } from "next/navigation";
import { TabBar } from "./TabBar";
import { OfflineBanner } from "./OfflineBanner";

const PUBLIC_ROUTES = ["/login", "/register", "/auth", "/join", "/shared", "/e"];
/** Rutas a pantalla completa sin barra de pestañas (flujos, hojas, onboarding) */
const FULLSCREEN_PREFIXES = ["/mascotas/nueva", "/onboarding", "/sos", "/reservar", "/negocios/", "/eventos/", "/asistente", "/perdida"];

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pub = isPublicRoute(pathname);
  const fullscreen = FULLSCREEN_PREFIXES.some((p) => pathname.startsWith(p));
  const showTabs = !pub && !fullscreen;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col bg-bg md:border-x md:border-outline-variant">
      {!pub && <OfflineBanner />}
      <main className={showTabs ? "flex-1 pb-[calc(104px+env(safe-area-inset-bottom))]" : "flex-1"}>{children}</main>
      {showTabs && <TabBar />}
    </div>
  );
}
