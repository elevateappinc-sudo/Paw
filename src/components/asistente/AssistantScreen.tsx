"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles, X, SendHorizontal, Trash2 } from "lucide-react";
import { Chip, ChipRow, EmptyState, PawDotsLoader, Skeleton, showToast } from "@/components/ui";
import { useActivePet } from "@/hooks/useActivePet";
import { useAuthContext } from "@/contexts/AuthContext";
import { isMissingSchema } from "@/lib/api/schemaErrors";
import { formatDate } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import type { AssistantAction } from "@/types/db";
import { PetPicker } from "@/components/sos/PetPicker";
import { MessageBubble } from "./MessageBubble";
import { ActionChips } from "./ActionChips";
import { applyLog, applyRemind, askAssistant, clearMessages, loadMessages, SUGGESTIONS, uid, type ChatMessage } from "./assistantData";

export function AssistantScreen() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { user } = useAuthContext();
  const { pet, pets, selectPet } = useActivePet();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [persistent, setPersistent] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [busyAction, setBusyAction] = useState<{ msg: string; index: number } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const toasted = useRef(false);
  const memory = useRef<Record<string, ChatMessage[]>>({});

  // Historial por mascota
  useEffect(() => {
    if (!user || !pet) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadMessages(user.id, pet.id)
      .then((rows) => {
        if (cancelled) return;
        setMessages(rows ?? []);
        setPersistent(true);
      })
      .catch((e) => {
        if (cancelled) return;
        setPersistent(false);
        setMessages(memory.current[pet.id] ?? []);
        if (isMissingSchema(e) && !toasted.current) {
          toasted.current = true;
          showToast("La conversación no se guardará todavía");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, pet]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [messages, sending, reduce]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || !pet || sending) return;
      setInput("");
      const userMsg: ChatMessage = { id: uid(), role: "user", content: q, actions: [], created_at: new Date().toISOString() };
      const history = messages;
      setMessages((m) => [...m, userMsg]);
      setSending(true);
      try {
        const reply = await askAssistant(pet.id, q, history);
        const botMsg: ChatMessage = { id: uid(), role: "assistant", content: reply.content, actions: reply.actions, created_at: new Date().toISOString() };
        setMessages((m) => {
          const next = [...m, botMsg];
          if (!persistent || !reply.persisted) memory.current[pet.id] = next;
          return next;
        });
      } catch (e) {
        setMessages((m) => m.filter((x) => x.id !== userMsg.id));
        setInput(q);
        showToast(e instanceof Error ? e.message : "El asistente no respondió", () => void send(q), "error");
      } finally {
        setSending(false);
      }
    },
    [pet, sending, messages, persistent]
  );

  const runAction = useCallback(
    async (msg: ChatMessage, index: number, action: AssistantAction) => {
      if (!pet || !user) return;
      const markDone = () => setMessages((m) => m.map((x) => (x.id === msg.id ? { ...x, done: [...(x.done ?? []), index] } : x)));
      if (action.type === "sos") {
        router.push("/sos");
        return;
      }
      if (action.type === "book") {
        router.push(`/explorar?cat=${action.category}`);
        return;
      }
      setBusyAction({ msg: msg.id, index });
      try {
        if (action.type === "remind") {
          const date = await applyRemind(action);
          showToast(`Recordatorio movido al ${formatDate(date)}`, undefined, "success");
        } else if (action.type === "log") {
          await applyLog(pet.id, user.id, action);
          showToast(`Quedó en el historial de ${pet.name}`, undefined, "success");
        }
        markDone();
      } catch (e) {
        showToast(isMissingSchema(e) ? "Esta acción aún no está disponible" : "No pudimos completar la acción", undefined, "error");
      } finally {
        setBusyAction(null);
      }
    },
    [pet, user, router]
  );

  async function clear() {
    if (!pet || !user || !messages.length) return;
    try {
      if (persistent) await clearMessages(user.id, pet.id);
      memory.current[pet.id] = [];
      setMessages([]);
    } catch {
      showToast("No pudimos borrar la conversación", undefined, "error");
    }
  }

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex items-start justify-between gap-3 px-4 pt-[max(16px,env(safe-area-inset-top))] pb-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-display leading-tight text-text">Asistente{pet ? ` de ${pet.name}` : ""}</h1>
            <p className="text-small text-text-secondary">Conoce su historial, ciclos y alergias</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 0 && (
            <button type="button" onClick={clear} aria-label="Borrar conversación" className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary active:scale-95">
              <Trash2 size={18} />
            </button>
          )}
          <button type="button" onClick={() => router.back()} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-elevated text-text active:scale-95">
            <X size={20} />
          </button>
        </div>
      </header>

      {pets.length > 1 && (
        <div className="px-4 pb-1">
          <PetPicker pets={pets} activeId={pet?.id ?? null} onSelect={selectPet} />
        </div>
      )}

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {!pet ? (
          <EmptyState title="Agrega una mascota" description="El asistente responde con el historial de tu mascota." />
        ) : loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-3/4 rounded-md" />
            <Skeleton className="ml-auto h-10 w-1/2 rounded-md" />
            <Skeleton className="h-20 w-4/5 rounded-md" />
          </div>
        ) : messages.length === 0 && !sending ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <p className="max-w-[300px] text-body text-text-secondary">Pregúntame por el peso, las vacunas, la comida o cualquier duda sobre {pet.name}. No sustituyo al veterinario.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <motion.div key={m.id} variants={reduce ? undefined : fadeUp} initial="hidden" animate="show">
                <MessageBubble role={m.role} content={m.content}>
                  {m.role === "assistant" && (
                    <ActionChips actions={m.actions} done={m.done ?? []} busy={busyAction?.msg === m.id ? busyAction.index : null} onRun={(i, a) => void runAction(m, i, a)} />
                  )}
                </MessageBubble>
              </motion.div>
            ))}
            {sending && (
              <div className="flex items-center gap-2 self-start rounded-md border border-border bg-surface px-4 py-3 text-small text-text-secondary">
                <PawDotsLoader size={18} label="Pensando" />
                <span aria-hidden="true">Pensando…</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-surface px-4 pt-2 pb-[max(12px,env(safe-area-inset-bottom))]">
        {pet && messages.length === 0 && !loading && (
          <ChipRow className="mb-2">
            {SUGGESTIONS.map((s) => (
              <Chip key={s} onClick={() => void send(s)}>
                {s}
              </Chip>
            ))}
          </ChipRow>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label htmlFor="assistant-input" className="sr-only">Escribe tu pregunta</label>
          <textarea
            id="assistant-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={pet ? `Pregunta sobre ${pet.name}…` : "Agrega una mascota para empezar"}
            disabled={!pet || sending}
            className="max-h-[120px] min-h-11 flex-1 resize-none rounded-xl border border-border bg-bg px-4 py-3 text-subtitle text-text outline-none placeholder:text-text-secondary focus:border-primary"
          />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={!pet || sending || !input.trim()}
            className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition-opacity disabled:opacity-40"
          >
            <SendHorizontal size={18} aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
