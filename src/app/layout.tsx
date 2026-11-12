import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PetsLoader } from "@/components/auth/PetsLoader";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeInit } from "@/components/settings/ThemeInit";
import { NativePushInit } from "@/components/notifications/NativePushInit";

// Familia de --font-sans (src/styles/tokens.css). Solo dos pesos: 400 y 600.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Paw", template: "%s · Paw" },
  description: "Todo lo que tu mascota necesita, cerca de ti.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Paw" },
  icons: { icon: "/icon.svg", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  // La meta theme-color no acepta variables CSS: replica --color-bg de tokens.css
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2F5FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0C0F" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={jakarta.variable} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ToastProvider>
            <ThemeInit />
            <NativePushInit />
            <PetsLoader />
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
