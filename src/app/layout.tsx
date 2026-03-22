import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ServiceWorkerRegistration } from "@/components/notifications/ServiceWorkerRegistration";
import { IOSInstallBanner } from "@/components/notifications/IOSInstallBanner";

export const metadata: Metadata = {
  title: "PAW",
  description: "Tu compañero de gestión animal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ background: "#000000", minHeight: "100dvh", margin: 0 }}>
        <AuthProvider>
          {children}
          <ServiceWorkerRegistration />
          <IOSInstallBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
