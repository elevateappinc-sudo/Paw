"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const STORAGE_KEY = "ios_banner_last_shown";
const COOLDOWN_DAYS = 7;
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";

export function IOSInstallBanner() {
  const { isIOS } = usePushNotifications();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOS) return;

    // Don't show if already installed as PWA
    if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return;

    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown) {
      const daysSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) return;
    }

    setVisible(true);
  }, [isIOS]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label="Instala la app"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#1c1c1e",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "16px 16px 0 0",
        padding: "16px 20px 32px",
        fontFamily: FONT,
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* Paw icon */}
      <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>🐾</span>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.3 }}>
          Instala Paw en tu iPhone para recibir recordatorios 🐾
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(235,235,245,0.5)", lineHeight: 1.4 }}>
          Toca{" "}
          <span style={{ color: "#FF7A45" }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ display: "inline", verticalAlign: "middle" }}
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </span>{" "}
          y luego <strong style={{ color: "#FF7A45" }}>«Agregar a inicio»</strong>
        </p>
      </div>

      {/* Close */}
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={14} color="rgba(235,235,245,0.6)" />
      </button>
    </div>
  );
}
