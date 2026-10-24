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
    <div role="status" className="flex items-center gap-3 border-b border-border bg-border px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 text-small font-semibold text-text">
      <WifiOff size={16} className="text-text-secondary" aria-hidden="true" />
      <span className="flex-1">Sin conexión{since ? ` · datos guardados a las ${since}` : ""}</span>
      <span className="text-small text-text-secondary">SOS sigue disponible</span>
    </div>
  );
}
