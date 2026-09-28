import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getRole } from "@/lib/data/auth";
import { getCurrentUser } from "@/lib/data/players";
import { getConversation, getMessages } from "@/lib/data/chat";
import { ChatThread } from "@/components/ChatThread";
import { ConversationAvatar } from "@/components/ConversationAvatar";

export default async function ChatConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, role] = await Promise.all([getCurrentUser(), getRole()]);
  if (!user || !role) redirect("/login");

  // RLS: si la conversación no es del usuario, no aparece y da 404.
  const conversation = await getConversation(id, role);
  if (!conversation) notFound();
  const messages = await getMessages(id);

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] min-h-96 max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link
          href="/chat"
          aria-label="Volver a los chats"
          className="rounded-md p-1.5 text-text-muted hover:bg-bg-subtle hover:text-text"
        >
          ←
        </Link>
        <ConversationAvatar
          name={conversation.counterpart_name}
          avatarUrl={conversation.counterpart_avatar}
          className="h-9 w-9 text-sm"
          isClub={role !== "club"}
        />
        <div className="min-w-0 flex-1">
          {role === "club" && conversation.player_id ? (
            <Link
              href={`/player/${conversation.player_id}`}
              className="block truncate font-medium text-text hover:underline"
            >
              {conversation.counterpart_name}
            </Link>
          ) : (
            <p className="truncate font-medium text-text">{conversation.counterpart_name}</p>
          )}
          {conversation.counterpart_subtitle && (
            <p className="truncate text-xs text-text-muted">{conversation.counterpart_subtitle}</p>
          )}
        </div>
      </header>

      <ChatThread conversationId={id} currentUserId={user.id} initialMessages={messages} />
    </div>
  );
}
