import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { PetsLoader } from "@/components/auth/PetsLoader";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeInit } from "@/components/settings/ThemeInit";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-figtree",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6F1" },
    { media: "(prefers-color-scheme: dark)", color: "#15100D" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={figtree.variable} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ToastProvider>
            <ThemeInit />
            <PetsLoader />
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
