"use client";
import { useCallback, useEffect, useState } from "react";
import { PawPrint } from "lucide-react";
import { Button, Card, EmptyState, Row, SkeletonRow } from "@/components/ui";
import { fetchBusinessBookings } from "@/lib/api/bookings";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { relativeTime } from "@/lib/relativeTime";
import type { Business } from "@/types/db";

interface Client {
  pet_id: string;
  name: string;
  visits: number;
  last: string;
  lastService: string | null;
}

export function ClientesTab({ business }: { business: Business }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchBusinessBookings(business.id);
      const map = new Map<string, Client>();
      for (const b of rows) {
        if (b.status !== "completed") continue;
        const cur = map.get(b.pet_id);
        const when = b.completed_at ?? b.starts_at;
        if (!cur) map.set(b.pet_id, { pet_id: b.pet_id, name: b.pets?.name ?? "Mascota", visits: 1, last: when, lastService: b.business_services?.name ?? null });
        else {
          cur.visits += 1;
          if (when > cur.last) {
            cur.last = when;
            cur.lastService = b.business_services?.name ?? cur.lastService;
          }
        }
      }
      setClients([...map.values()].sort((a, b) => b.last.localeCompare(a.last)));
    } catch (e) {
      if (isMissingSchema(e)) setClients([]);
      else setError("No pudimos cargar los clientes");
    } finally {
      setLoading(false);
    }
  }, [business.id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card padded={false}>
        <SkeletonRow trailing={false} />
        <SkeletonRow trailing={false} />
        <SkeletonRow trailing={false} />
      </Card>
    );
  }
  if (error) return <EmptyState compact title="Algo salió mal" description={error} action={<Button full onClick={load}>Reintentar</Button>} />;
  if (clients.length === 0) return <EmptyState compact title="Aún no tienes clientes" description="Cuando completes una cita, la mascota aparecerá aquí con su última visita." />;

  return (
    <Card padded={false} className="divide-y divide-border">
      {clients.map((c) => (
        <Row
          key={c.pet_id}
          icon={<PawPrint size={20} aria-hidden="true" />}
          iconTone="primary"
          title={c.name}
          subtitle={`Última visita ${relativeTime(c.last)}${c.lastService ? ` · ${c.lastService}` : ""}`}
          trailing={<span className="text-small font-semibold text-text-secondary">{c.visits} {c.visits === 1 ? "visita" : "visitas"}</span>}
        />
      ))}
    </Card>
  );
}
