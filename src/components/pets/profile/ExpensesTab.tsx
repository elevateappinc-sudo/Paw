"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, Skeleton, buttonVariants, showToast } from "@/components/ui";
import { fetchExpenses } from "@/lib/api/expenses";
import { formatCurrency } from "@/lib/utils";

export function ExpensesTab({ petId }: { petId: string }) {
  const [summary, setSummary] = useState<{ total: number; count: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const month = new Date().toISOString().slice(0, 7);
    fetchExpenses(petId)
      .then((rows) => {
        if (cancelled) return;
        const mine = rows.filter((g) => g.fecha.startsWith(month));
        setSummary({ total: mine.reduce((s, g) => s + g.monto, 0), count: mine.length });
      })
      .catch(() => {
        if (!cancelled) {
          setSummary({ total: 0, count: 0 });
          showToast("No pudimos cargar los gastos", undefined, "error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [petId]);

  const monthLabel = new Date().toLocaleDateString("es-CO", { month: "long" });

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <Card tone="container" elevation={0}>
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface text-primary">
            <Receipt size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold capitalize text-on-variant">Gastos de {monthLabel}</div>
            {summary === null ? (
              <Skeleton className="mt-1 h-7 w-32" />
            ) : (
              <div className="font-display text-[28px] leading-tight text-on">{formatCurrency(summary.total)}</div>
            )}
            {summary !== null && <div className="text-[13px] text-on-variant">{summary.count === 0 ? "Sin gastos este mes" : `${summary.count} ${summary.count === 1 ? "gasto" : "gastos"}`}</div>}
          </div>
        </div>
      </Card>
      <Link href="/gastos" className={buttonVariants({ variant: "tonal", size: "lg", full: true })}>
        Ver todos los gastos
      </Link>
    </div>
  );
}
