import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { PetsLoader } from "@/components/auth/PetsLoader";
import { NavGuard, MainContent } from "@/components/layout/NavGuard";

export const metadata: Metadata = {
  title: "PAW",
  description: "Tu compañero de gestión animal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ background: "#000000", minHeight: "100dvh", margin: 0 }}>
        <AuthProvider>
          <ToastProvider>
            <PetsLoader />
            <NavGuard>
              <Sidebar />
            </NavGuard>
            <MainContent>
              {children}
            </MainContent>
            <NavGuard>
              <BottomNav />
            </NavGuard>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
