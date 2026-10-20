"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ChevronRight, Clock } from "lucide-react";
import { PetBath, PetFood, PetTraining } from "@/components/icons/pet";
import { useActivePet } from "@/hooks/useActivePet";
import { fadeUp, stagger } from "@/lib/motion";
import { Card, Divider, PageHeader, Row, SectionTitle } from "@/components/ui";

const ACCESOS = [
  { href: "/actividad/itinerario", title: "Rutina diaria", description: "Comidas y salidas de cada día", icon: Clock },
  { href: "/actividad/entrenamiento", title: "Entrenamiento", description: "Clases, tareas y avances", icon: PetTraining },
];

/** Portada de /actividad: dos accesos principales y enlaces a cuidados. */
export function ActividadHub() {
  const { pet } = useActivePet();
  const reduce = useReducedMotion();
  return (
    <motion.div className="enter-list flex flex-col gap-4 pb-6" variants={reduce ? undefined : stagger()} animate="show">
      <PageHeader title="Actividad" eyebrow={pet?.name ?? "Mascota"} back backHref="/home" />

      <motion.section className="grid grid-cols-2 gap-3 px-4" variants={fadeUp} aria-label="Accesos">
        {ACCESOS.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="block rounded-md focus-visible:outline-2 focus-visible:outline-primary">
            <Card interactive tone="surface" className="flex h-full flex-col gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
                <Icon size={24} aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-semibold text-subtitle leading-tight text-text">{title}</h3>
                <p className="mt-1 text-small text-text-secondary">{description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </motion.section>

      <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp}>
        <SectionTitle>Cuidados</SectionTitle>
        <Card padded={false} className="overflow-hidden">
          <Row
            href="/alimentacion"
            icon={<PetFood size={20} aria-hidden="true" />}
            iconTone="primary"
            title="Alimentación"
            subtitle="Ración diaria y recompra"
            trailing={<ChevronRight size={18} className="text-text-secondary" aria-hidden="true" />}
          />
          <Divider />
          <Row
            href="/higiene"
            icon={<PetBath size={20} aria-hidden="true" />}
            iconTone="info"
            title="Higiene"
            subtitle="Baño, uñas y desparasitación"
            trailing={<ChevronRight size={18} className="text-text-secondary" aria-hidden="true" />}
          />
        </Card>
      </motion.section>
    </motion.div>
  );
}
