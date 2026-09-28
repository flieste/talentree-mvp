"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { sendMessage } from "@/app/(app)/chat/actions";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Message } from "@/lib/types";

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

export function ChatThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [supabase] = useState(() => createClient());
  const bottomRef = useRef<HTMLDivElement>(null);

  const addMessage = (m: Message) =>
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));

  // Mensajes nuevos de la otra persona, en tiempo real.
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => addMessage(payload.new as Message),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  function send() {
    const text = draft.trim();
    if (!text || isPending) return;
    setError(undefined);
    startTransition(async () => {
      const result = await sendMessage(conversationId, text);
      if (result.error || !result.message) {
        setError(result.error ?? "No pudimos enviar el mensaje.");
        return;
      }
      addMessage(result.message);
      setDraft("");
    });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-bg-subtle px-4 py-4">
        {messages.length === 0 && (
          <p className="m-auto text-center text-sm text-text-muted">
            Todavía no hay mensajes. Escribí el primero.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[0.95rem]",
                  mine
                    ? "rounded-br-sm bg-accent text-accent-contrast"
                    : "rounded-bl-sm border border-border bg-surface text-text",
                )}
              >
                {m.content}
                <span
                  className={cn(
                    "mt-0.5 block text-right text-[0.65rem]",
                    mine ? "text-accent-contrast/70" : "text-text-muted",
                  )}
                >
                  {time(m.created_at)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        {error && (
          <p role="alert" className="mb-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={2000}
            placeholder="Escribí un mensaje"
            aria-label="Escribí un mensaje"
            className="max-h-32 min-h-[2.75rem] flex-1 resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[0.95rem] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent"
          />
          <button
            type="button"
            onClick={send}
            disabled={!draft.trim() || isPending}
            className="h-11 rounded-lg bg-accent px-4 text-[0.95rem] font-medium text-accent-contrast transition-colors hover:bg-accent-strong disabled:pointer-events-none disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </>
  );
}
