"use client";
import { useCallback, useEffect, useState } from "react";
import { MessageSquareReply } from "lucide-react";
import { Button, Card, EmptyState, Rating, Sheet, Skeleton, Textarea, showToast } from "@/components/ui";
import { fetchReviews, replyReview } from "@/lib/api/businesses";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { relativeTime } from "@/lib/relativeTime";
import type { Business, Review } from "@/types/db";

export function ResenasTab({ business }: { business: Business }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<Review | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReviews(await fetchReviews(business.id, 50));
    } catch (e) {
      if (isMissingSchema(e)) setReviews([]);
      else setError("No pudimos cargar las reseñas");
    } finally {
      setLoading(false);
    }
  }, [business.id]);

  useEffect(() => {
    void load();
  }, [load]);

  function openReply(r: Review) {
    setTarget(r);
    setReply(r.reply ?? "");
  }

  async function submit() {
    if (!target || !reply.trim()) return;
    setSaving(true);
    try {
      await replyReview(target.id, reply.trim());
      setReviews((rs) => rs.map((r) => (r.id === target.id ? { ...r, reply: reply.trim(), replied_at: new Date().toISOString() } : r)));
      setTarget(null);
      showToast("Respuesta publicada", undefined, "success");
    } catch {
      showToast("No pudimos publicar la respuesta", () => void submit(), "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-[110px] rounded-md" />
        <Skeleton className="h-[110px] rounded-md" />
      </div>
    );
  }
  if (error) return <EmptyState compact title="Algo salió mal" description={error} action={<Button full onClick={load}>Reintentar</Button>} />;
  if (reviews.length === 0) return <EmptyState compact title="Aún no tienes reseñas" description="Pide a tus clientes que te califiquen desde la app después de una cita." />;

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-body font-semibold text-text">
                {r.users?.display_name ?? "Cliente"}
                {r.pets?.name ? <span className="font-semibold text-text-secondary"> · {r.pets.name}</span> : null}
              </div>
              <div className="text-small text-text-secondary">{relativeTime(r.created_at)}</div>
            </div>
            <Rating value={Number(r.rating)} />
          </div>
          {r.body && <p className="mt-2 text-body text-text">{r.body}</p>}
          {r.reply ? (
            <div className="mt-3 rounded-md bg-surface-elevated px-3 py-2 text-body text-text">
              <div className="text-label font-semibold text-text-secondary">Tu respuesta</div>
              {r.reply}
              <button type="button" onClick={() => openReply(r)} className="mt-1 block text-small font-semibold text-primary-text">Editar</button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" className="mt-3" leading={<MessageSquareReply size={16} aria-hidden="true" />} onClick={() => openReply(r)}>
              Responder
            </Button>
          )}
        </Card>
      ))}

      <Sheet
        open={!!target}
        onClose={() => setTarget(null)}
        title="Responder reseña"
        subtitle={target ? `${target.users?.display_name ?? "Cliente"} · ${target.rating} de 5` : undefined}
        footer={<Button full size="lg" onClick={submit} loading={saving} disabled={!reply.trim()}>Publicar respuesta</Button>}
      >
        {target?.body && <p className="mb-3 rounded-md bg-surface-elevated px-3 py-2 text-body text-text-secondary">{target.body}</p>}
        <Textarea label="Tu respuesta" placeholder="Gracias por tu visita…" value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
      </Sheet>
    </div>
  );
}
