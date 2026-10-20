"use client";
import { useState } from "react";
import { Star } from "lucide-react";
import { Button, Card, CardHeader, Select, Sheet, Textarea, showToast } from "@/components/ui";
import { upsertReview } from "@/lib/api/businesses";
import type { Pet } from "@/types";
import type { Review } from "@/types/db";
import { cn } from "@/lib/utils";
import { friendlyError, relativeDays } from "@/components/explorar/lib";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= value ? "fill-warning text-warning" : "text-border"} aria-hidden="true" />
      ))}
    </span>
  );
}

export interface ReviewsCardProps {
  businessId: string;
  businessName: string;
  reviews: Review[];
  onReviewSaved: (r: Review) => void;
  userId: string | null;
  pets: Pet[];
  activePetId: string | null;
  error?: string | null;
}

export function ReviewsCard({ businessId, businessName, reviews, onReviewSaved, userId, pets, activePetId, error }: ReviewsCardProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [petId, setPetId] = useState<string>(activePetId ?? pets[0]?.id ?? "");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!userId) {
      showToast("Inicia sesión para escribir una reseña", undefined, "error");
      return;
    }
    if (rating === 0) {
      showToast("Elige cuántas estrellas le das", undefined, "error");
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertReview({ business_id: businessId, user_id: userId, pet_id: petId || null, rating, body: body.trim() || undefined });
      const pet = pets.find((p) => p.id === petId);
      onReviewSaved({ ...saved, pets: pet ? { name: pet.name, breed: pet.breed ?? null } : saved.pets ?? null, users: saved.users ?? { display_name: "Tú" } });
      showToast("Gracias por tu reseña", undefined, "success");
      setOpen(false);
      setBody("");
      setRating(0);
    } catch (e) {
      showToast(friendlyError(e), submit, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Reseñas"
        subtitle={reviews.length ? `${reviews.length} ${reviews.length === 1 ? "opinión" : "opiniones"}` : undefined}
        action={
          <button type="button" onClick={() => setOpen(true)} className="min-h-11 px-1">
            Escribir una
          </button>
        }
      />
      {error ? (
        <p className="text-body text-text-secondary">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="text-body text-text-secondary">Todavía nadie opinó sobre {businessName}. Sé la primera persona.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {reviews.map((r) => {
            const name = r.users?.display_name?.trim() || "Alguien de Paw";
            const petMeta = r.pets ? `con ${r.pets.name}${r.pets.breed ? `, ${r.pets.breed}` : ""} · ` : "";
            return (
              <li key={r.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-subtitle text-primary-text" aria-hidden="true">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-body font-semibold text-text">{name}</span>
                    <Stars value={r.rating} />
                  </div>
                  <p className="text-label text-text-secondary">
                    {petMeta}
                    {relativeDays(r.created_at)}
                  </p>
                  {r.body && <p className="mt-2 text-body leading-relaxed text-text">{r.body}</p>}
                  {r.reply && (
                    <div className="mt-2 rounded-md bg-surface-elevated px-3 py-2">
                      <p className="text-label font-semibold text-text-secondary">Respuesta de {businessName}</p>
                      <p className="mt-1 text-small leading-relaxed text-text">{r.reply}</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="Tu reseña"
        subtitle={businessName}
        footer={
          <Button full size="lg" onClick={submit} loading={saving} disabled={rating === 0}>
            Publicar reseña
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-small font-semibold text-text-secondary">¿Cómo te fue?</p>
            <div className="flex gap-1" role="radiogroup" aria-label="Estrellas">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={rating === i}
                  aria-label={`${i} ${i === 1 ? "estrella" : "estrellas"}`}
                  onClick={() => setRating(i)}
                  className="flex h-12 w-12 items-center justify-center rounded-full active:scale-95"
                >
                  <Star size={30} className={cn("transition-colors", i <= rating ? "fill-warning text-warning" : "text-border")} />
                </button>
              ))}
            </div>
          </div>
          {pets.length > 0 && (
            <Select label="Con qué mascota fuiste" value={petId} onChange={(e) => setPetId(e.target.value)} options={pets.map((p) => ({ value: p.id, label: p.name }))} />
          )}
          <Textarea label="Cuéntanos (opcional)" placeholder="Qué te gustó, qué mejorarías…" value={body} onChange={(e) => setBody(e.target.value)} maxLength={600} rows={4} />
        </div>
      </Sheet>
    </Card>
  );
}
