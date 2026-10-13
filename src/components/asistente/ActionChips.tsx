"use client";
import { Bell, ShoppingBag, NotebookPen, Siren, Check } from "lucide-react";
import type { AssistantAction } from "@/types/db";
import { cn } from "@/lib/utils";

const ICON: Record<AssistantAction["type"], React.ReactNode> = {
  remind: <Bell size={14} aria-hidden="true" />,
  book: <ShoppingBag size={14} aria-hidden="true" />,
  log: <NotebookPen size={14} aria-hidden="true" />,
  sos: <Siren size={14} aria-hidden="true" />,
};

export function ActionChips({ actions, done, busy, onRun }: { actions: AssistantAction[]; done: number[]; busy: number | null; onRun: (index: number, action: AssistantAction) => void }) {
  if (!actions.length) return null;
  return (
    <div className="mt-1.5 flex max-w-[86%] flex-wrap gap-1.5">
      {actions.map((a, i) => {
        const isDone = done.includes(i);
        const isBusy = busy === i;
        const danger = a.type === "sos";
        return (
          <button
            key={i}
            type="button"
            disabled={isDone || isBusy}
            onClick={() => onRun(i, a)}
            className={cn(
              "inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-[13px] font-bold transition-[transform,opacity] active:scale-95 disabled:opacity-70",
              danger ? "bg-danger-container text-on-danger-container" : isDone ? "bg-ok-container text-on-ok-container" : "bg-primary-container text-on-primary-container"
            )}
          >
            {isDone ? <Check size={14} aria-hidden="true" /> : ICON[a.type]}
            {isBusy ? "Un momento…" : a.label}
          </button>
        );
      })}
    </div>
  );
}
