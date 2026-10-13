"use client";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/** Banda superior cuando no hay conexión: todo lo cacheado sigue visible. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const [since, setSince] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const off = !navigator.onLine;
      setOffline(off);
      if (off && !since) setSince(new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
      if (!off) setSince(null);
    };
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, [since]);

  if (!offline) return null;
  return (
    <div role="status" className="flex items-center gap-2.5 border-b border-outline-variant bg-surface-3 px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2.5 text-[13px] font-semibold text-on">
      <WifiOff size={16} className="text-on-variant" aria-hidden="true" />
      <span className="flex-1">Sin conexión{since ? ` · datos guardados a las ${since}` : ""}</span>
      <span className="text-[12px] text-on-variant">SOS sigue disponible</span>
    </div>
  );
}
