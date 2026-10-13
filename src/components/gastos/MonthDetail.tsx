"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useStore } from "@/store";
import { formatCurrency, formatDate, getMonthKey, getMonthLabel } from "@/lib/utils";
import { Button, Card, Divider, Row, Tag, showToast } from "@/components/ui";
import { GastoForm } from "./GastoForm";
import type { Gasto } from "@/types";

interface MonthDetailProps {
  month: string;
  onClose: () => void;
}

export function MonthDetail({ month, onClose }: MonthDetailProps) {
  const { gastos, deleteGasto, selectedPetId } = useStore();
  const [editGasto, setEditGasto] = useState<Gasto | null>(null);
  const [expandedConcepto, setExpandedConcepto] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const monthGastos = gastos.filter((g) => g.petId === selectedPetId && getMonthKey(g.fecha) === month);

  const byConcepto: Record<string, Gasto[]> = {};
  for (const g of monthGastos) {
    if (!byConcepto[g.concepto]) byConcepto[g.concepto] = [];
    byConcepto[g.concepto].push(g);
  }

  const total = monthGastos.reduce((sum, g) => sum + g.monto, 0);

  async function handleDelete(id: string) {
    try {
      await deleteGasto(id);
    } catch {
      showToast("No se pudo eliminar el gasto", () => void handleDelete(id), "error");
    }
  }

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-on-variant">Detalle</div>
          <h3 className="font-display text-[18px] capitalize leading-tight text-on">{getMonthLabel(month)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold text-primary">{formatCurrency(total)}</span>
          <Button variant="secondary" size="icon" onClick={onClose} aria-label="Cerrar detalle del mes" className="min-h-[36px] min-w-[36px]">
            <X size={16} />
          </Button>
        </div>
      </div>

      {monthGastos.length === 0 && <p className="px-4 py-8 text-center text-[14px] text-on-variant">No hay gastos en este mes</p>}

      {Object.entries(byConcepto).map(([concepto, items], idx) => {
        const subtotal = items.reduce((s, g) => s + g.monto, 0);
        const isExpanded = expandedConcepto === concepto;
        return (
          <div key={concepto}>
            {idx > 0 && <Divider />}
            <Row
              icon={<span className="text-[15px] font-bold">{concepto.charAt(0).toUpperCase()}</span>}
              iconTone="primary"
              title={concepto}
              subtitle={`${items.length} registro${items.length !== 1 ? "s" : ""}`}
              onClick={() => setExpandedConcepto(isExpanded ? null : concepto)}
              trailing={
                <span className="flex items-center gap-2 text-[15px] font-bold text-on">
                  {formatCurrency(subtotal)}
                  {isExpanded ? <ChevronUp size={16} className="text-on-variant" /> : <ChevronDown size={16} className="text-on-variant" />}
                </span>
              }
            />
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-surface-2/60"
                >
                  {items.map((g, i) => (
                    <div key={g.id}>
                      {i > 0 && <Divider className="ml-4 mr-0" />}
                      <div className="flex items-center justify-between gap-2 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[14px] font-bold text-on">{formatCurrency(g.monto)}</span>
                            <Tag size="xs">{formatDate(g.fecha)}</Tag>
                            <Tag size="xs" tone="primary">{g.quien}</Tag>
                          </div>
                          {g.notas && <p className="mt-1 truncate text-[12px] text-on-variant">{g.notas}</p>}
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="secondary" size="icon" aria-label={`Editar gasto de ${g.concepto}`} onClick={() => setEditGasto(g)}>
                            <Pencil size={15} />
                          </Button>
                          <Button variant="dangerTonal" size="icon" aria-label={`Eliminar gasto de ${g.concepto}`} onClick={() => void handleDelete(g.id)} className="border-transparent">
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {editGasto && <GastoForm key={editGasto.id} open onClose={() => setEditGasto(null)} editGasto={editGasto} />}
    </Card>
  );
}
