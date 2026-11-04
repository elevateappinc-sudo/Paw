"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Receipt } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { fetchExpenses } from "@/lib/api/expenses";
import { formatCurrency } from "@/lib/utils";

export function ExpensesTab({ petId }: { petId: string }) {
  const [summary, setSummary] = useState<{ total: number; count: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const month = new Date().toISOString().slice(0, 7);
    fetchExpenses(petId)
      .then((rows) => {
        if (cancelled) return;
        const mine = rows.filter((g) => g.fecha.startsWith(month));
        setSummary({ total: mine.reduce((s, g) => s + g.monto, 0), count: mine.length });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [petId, attempt]);

  const monthLabel = new Date().toLocaleDateString("es-CO", { month: "long" });

  // Fila compacta: el detalle vive en /gastos
  return (
    <Link href="/gastos" className="pressable flex min-h-16 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-pastel-lilac text-primary-text">
        <Receipt size={20} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small text-text-secondary first-letter:uppercase">Gastos de {monthLabel}</span>
        {failed ? (
          <span className="block text-body text-text">No pudimos cargarlos</span>
        ) : summary === null ? (
          <Skeleton className="mt-1 h-5 w-24" />
        ) : (
          <span className="block text-body font-semibold text-text">
            {formatCurrency(summary.total)}
            <span className="font-normal text-text-secondary"> · {summary.count === 0 ? "sin gastos" : `${summary.count} ${summary.count === 1 ? "gasto" : "gastos"}`}</span>
          </span>
        )}
      </span>
      {failed ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setAttempt((n) => n + 1);
          }}
          className="min-h-11 px-2 text-label font-semibold text-primary-text"
        >
          Reintentar
        </button>
      ) : (
        <ChevronRight size={18} className="shrink-0 text-text-secondary" aria-hidden="true" />
      )}
    </Link>
  );
}
