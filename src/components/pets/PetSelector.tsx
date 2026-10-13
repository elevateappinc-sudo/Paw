"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Plus, ChevronRight, LogOut, Trash2, Users } from "lucide-react";
import { useStore } from "@/store";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { fadeUp, stagger } from "@/lib/motion";
import { Button, Card, Divider, EmptyState, PageHeader, PetAvatarRing, Row, SectionTitle, Sheet, Tag } from "@/components/ui";
import { PetForm } from "./PetForm";
import type { Pet } from "@/types";

/** Lista de mascotas propias y compartidas para elegir la activa. */
export function PetSelector() {
  const { pets, selectPet, deletePet } = useStore();
  const { user } = useAuthContext();
  const { signOut } = useAuth();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState<Pet | null>(null);

  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email?.split("@")[0] ?? "Usuario";

  const myPets = pets.filter((p) => p.ownerId === user?.id);
  const sharedPets = pets.filter((p) => p.ownerId !== user?.id && (p.sharedWith ?? []).includes(user?.id ?? ""));

  function speciesLabel(pet: Pet) {
    return pet.species.charAt(0).toUpperCase() + pet.species.slice(1);
  }

  function renderPet(pet: Pet, isOwner: boolean, i: number, total: number) {
    return (
      <div key={pet.id}>
        {i > 0 && <Divider className="ml-[84px] mr-0" />}
        <Row
          icon={<PetAvatarRing pet={pet} size={56} />}
          title={
            <span className="flex items-center gap-2">
              <span className="truncate">{pet.name}</span>
              {!isOwner && (
                <Tag tone="info" size="xs">
                  Compartida
                </Tag>
              )}
            </span>
          }
          subtitle={`${speciesLabel(pet)}${pet.breed ? ` · ${pet.breed}` : ""}`}
          onClick={() => selectPet(pet.id)}
          trailing={
            <span className="flex items-center gap-1">
              {isOwner && (
                <Button
                  variant="dangerTonal"
                  size="icon"
                  aria-label={`Eliminar a ${pet.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setToDelete(pet);
                  }}
                  className="min-h-[40px] min-w-[40px] border-transparent"
                />
              )}
              <ChevronRight size={18} className="text-on-variant" aria-hidden="true" />
            </span>
          }
          className={cnRow(i, total)}
        />
      </div>
    );
  }

  return (
    <motion.div className="flex min-h-dvh flex-col gap-4 bg-bg pb-10" variants={reduce ? undefined : stagger()} initial={reduce ? false : "hidden"} animate="show">
      <PageHeader
        title="Mis mascotas"
        eyebrow={`Hola, ${displayName.split(" ")[0]}`}
        sos={false}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leading={<LogOut size={15} />}
            onClick={async () => {
              await signOut();
              router.replace("/login");
            }}
          >
            Salir
          </Button>
        }
      />

      {myPets.length > 0 && (
        <motion.section className="px-4" variants={fadeUp} aria-label="Mis mascotas">
          <Card padded={false} className="overflow-hidden">
            {myPets.map((pet, i) => renderPet(pet, true, i, myPets.length))}
          </Card>
        </motion.section>
      )}

      {sharedPets.length > 0 && (
        <motion.section className="flex flex-col gap-3 px-4" variants={fadeUp} aria-label="Compartidas conmigo">
          <SectionTitle>Compartidas conmigo</SectionTitle>
          <Card padded={false} className="overflow-hidden">
            {sharedPets.map((pet, i) => renderPet(pet, false, i, sharedPets.length))}
          </Card>
        </motion.section>
      )}

      {myPets.length === 0 && sharedPets.length === 0 && (
        <motion.div className="px-4" variants={fadeUp}>
          <EmptyState title="Sin mascotas aún" description="Agrega tu primera mascota para empezar." />
        </motion.div>
      )}

      {myPets.length === 0 && sharedPets.length > 0 && (
        <motion.div className="px-4" variants={fadeUp}>
          <Card tone="info" elevation={0} padded={false}>
            <Row icon={<Users size={18} aria-hidden="true" />} iconTone="info" title="Mascotas compartidas" subtitle="También puedes crear las tuyas." />
          </Card>
        </motion.div>
      )}

      <motion.div className="px-4" variants={fadeUp}>
        <Button full size="lg" leading={<Plus size={20} />} onClick={() => setShowForm(true)}>
          Agregar mascota
        </Button>
      </motion.div>

      {showForm && <PetForm onClose={() => setShowForm(false)} />}

      <Sheet open={toDelete !== null} onClose={() => setToDelete(null)} title={toDelete ? `¿Eliminar a ${toDelete.name}?` : undefined}>
        <div className="flex flex-col gap-4 pb-2">
          <p className="text-[15px] leading-relaxed text-on-variant">Se borrarán todos sus datos. Esta acción no se puede deshacer.</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setToDelete(null)} className="flex-1">
              Cancelar
            </Button>
            <Button
              variant="danger"
              leading={<Trash2 size={16} />}
              onClick={() => {
                if (toDelete) deletePet(toDelete.id);
                setToDelete(null);
              }}
              className="flex-1"
            >
              Eliminar
            </Button>
          </div>
        </div>
      </Sheet>
    </motion.div>
  );
}

function cnRow(_i: number, _total: number) {
  return undefined;
}
