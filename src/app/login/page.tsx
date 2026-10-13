import type { Metadata } from "next";
import { AuthPage } from "@/components/auth/AuthPage";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return <AuthPage />;
}
