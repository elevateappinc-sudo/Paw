"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Share, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { PawIllustration } from "@/components/ui";

const STORAGE_KEY = "ios_banner_last_shown";
const COOLDOWN_DAYS = 7;

/** Aviso para instalar la PWA en iPhone (Safari no muestra el prompt nativo). */
export function IOSInstallBanner() {
  const { isIOS } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!isIOS) return;
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return;
    try {
      const lastShown = localStorage.getItem(STORAGE_KEY);
      if (lastShown) {
        const daysSince = (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < COOLDOWN_DAYS) return;
      }
    } catch {
      // sin almacenamiento: mostramos igualmente
    }
    setVisible(true);
  }, [isIOS]);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignorar
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="complementary"
          aria-label="Instala la app"
          initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 bottom-0 z-[70] mx-auto flex w-full max-w-[640px] items-center gap-3 rounded-t-xl border-t border-border bg-surface px-5 pt-4 pb-[max(28px,env(safe-area-inset-bottom))] shadow-3"
        >
          <PawIllustration className="h-10 w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold leading-snug text-text">Instala Paw en tu iPhone para recibir recordatorios</p>
            <p className="mt-1 text-small leading-snug text-text-secondary">
              Toca{" "}
              <Share size={14} className="inline align-middle text-primary-text" aria-label="Compartir" />
              {" "}y luego <strong className="text-primary-text">«Agregar a inicio»</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Cerrar aviso"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text active:scale-95"
          >
            <X size={18} />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
