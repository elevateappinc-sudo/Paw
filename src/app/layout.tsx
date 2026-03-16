import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PAW",
  description: "Tu compañero de gestión animal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ background: "#000000", minHeight: "100dvh", margin: 0 }}>{children}</body>
    </html>
  );
}
