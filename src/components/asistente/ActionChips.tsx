"use client";
import { Bell, NotebookPen, Check } from "lucide-react";
import { PetEmergency, PetShop } from "@/components/icons/pet";
import type { AssistantAction } from "@/types/db";
import { cn } from "@/lib/utils";
import { PawDotsLoader } from "@/components/ui";

const ICON: Record<AssistantAction["type"], React.ReactNode> = {
  remind: <Bell size={14} aria-hidden="true" />,
  book: <PetShop size={14} aria-hidden="true" />,
  log: <NotebookPen size={14} aria-hidden="true" />,
  sos: <PetEmergency size={14} aria-hidden="true" />,
};

export function ActionChips({ actions, done, busy, onRun }: { actions: AssistantAction[]; done: number[]; busy: number | null; onRun: (index: number, action: AssistantAction) => void }) {
  if (!actions.length) return null;
  return (
    <div className="mt-2 flex max-w-[86%] flex-wrap gap-2">
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
              "inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-label font-semibold transition-[transform,opacity] active:scale-95 disabled:opacity-70",
              danger ? "bg-danger-soft text-danger-text" : isDone ? "bg-success-soft text-success-text" : "bg-primary-soft text-primary-text"
            )}
          >
            {isBusy ? <PawDotsLoader size={16} label="Un momento" /> : isDone ? <Check size={14} aria-hidden="true" /> : ICON[a.type]}
            {a.label}
          </button>
        );
      })}
    </div>
  );
}
