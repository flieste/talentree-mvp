import Link from "next/link";
import { getRole } from "@/lib/data/auth";
import { getConversations } from "@/lib/data/chat";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConversationAvatar } from "@/components/ConversationAvatar";

export const metadata = { title: "Chat — TalenTree" };

export default async function ChatPage() {
  const role = (await getRole()) ?? "player";
  const conversations = await getConversations(role);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Chat</h1>

      {conversations.length === 0 ? (
        <EmptyState
          title="No tenés conversaciones todavía."
          description={
            role === "club"
              ? "Entrá al perfil de un jugador y tocá Contactar para iniciar una conversación."
              : "Cuando un club se contacte con vos, tus conversaciones van a aparecer acá."
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/chat/${c.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent"
              >
                <ConversationAvatar
                  name={c.counterpart_name}
                  avatarUrl={c.counterpart_avatar}
                  isClub={role !== "club"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate font-medium text-text">{c.counterpart_name}</p>
                    <time className="shrink-0 text-xs text-text-muted" dateTime={c.updated_at}>
                      {new Date(c.updated_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </time>
                  </div>
                  <p className="truncate text-sm text-text-muted">
                    {c.last_message ?? "Todavía no hay mensajes."}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
