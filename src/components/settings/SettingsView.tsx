"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { CalendarDays, ChevronRight, LogOut, Mail, Palette } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Divider, PageHeader, Row, SectionTitle, showToast } from "@/components/ui";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { AccountSettings } from "./AccountSettings";
import { ThemeSelector } from "./ThemeSelector";

export function SettingsView({ email, googleLinked }: { email: string | null; googleLinked: boolean }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const reduce = useReducedMotion();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const result = await signOut();
    if (!result.ok) {
      setSigningOut(false);
      showToast(result.error ?? "No se pudo cerrar sesión", () => void handleSignOut(), "error");
      return;
    }
    router.replace("/login");
  }

  return (
    <motion.div className="flex flex-col gap-5 pb-8" variants={reduce ? undefined : stagger()} initial={reduce ? false : "hidden"} animate="show">
      <PageHeader title="Ajustes" back backHref="/home" />

      <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp} aria-label="Apariencia">
        <SectionTitle>Apariencia</SectionTitle>
        <Card padded={false} className="overflow-hidden">
          <Row icon={<Palette size={20} aria-hidden="true" />} iconTone="primary" title="Tema" subtitle="Claro, oscuro o el del sistema" />
          <div className="px-4 pb-4">
            <ThemeSelector />
          </div>
        </Card>
      </motion.section>

      <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp} aria-label="Cuenta">
        <SectionTitle>Cuenta</SectionTitle>
        <Card padded={false} className="overflow-hidden">
          <Row icon={<Mail size={20} aria-hidden="true" />} title="Correo" subtitle={email ?? "Sin correo"} />
        </Card>
        <AccountSettings googleLinked={googleLinked} />
      </motion.section>

      <motion.section className="px-4" variants={fadeUp}>
        <NotificationSettings />
      </motion.section>

      <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp} aria-label="Integraciones">
        <SectionTitle>Integraciones</SectionTitle>
        <Card padded={false} className="overflow-hidden">
          <Row
            href="/settings/integrations"
            icon={<CalendarDays size={20} aria-hidden="true" />}
            iconTone="info"
            title="Google Calendar"
            subtitle="Sincroniza comidas, salidas y citas"
            trailing={<ChevronRight size={18} className="text-on-variant" aria-hidden="true" />}
          />
          <Divider />
        </Card>
      </motion.section>

      <motion.div className="px-4" variants={fadeUp}>
        <Button variant="dangerTonal" full size="lg" leading={<LogOut size={18} />} onClick={() => void handleSignOut()} loading={signingOut}>
          Cerrar sesión
        </Button>
      </motion.div>
    </motion.div>
  );
}
