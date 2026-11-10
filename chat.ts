import "server-only";
import { createClient } from "@/lib/supabase/server";
import { POSITION_LABELS } from "@/lib/types";
import type { ConversationSummary, Message, PlayerPosition, UserRole } from "@/lib/types";

interface ConversationRow {
  id: string;
  updated_at: string;
  player: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    position: PlayerPosition | null;
  } | null;
  club: { id: string; club_name: string; city: string | null; logo_url: string | null } | null;
}

const SELECT =
  "id, updated_at, player:players(id, first_name, last_name, avatar_url, position), club:clubs(id, club_name, city, logo_url)";

function summarize(row: ConversationRow, role: UserRole): Omit<ConversationSummary, "last_message"> {
  if (role === "club") {
    const p = row.player;
    return {
      id: row.id,
      updated_at: row.updated_at,
      counterpart_name: p ? `${p.first_name} ${p.last_name}`.trim() : "Jugador",
      counterpart_subtitle: p?.position ? POSITION_LABELS[p.position] : null,
      counterpart_avatar: p?.avatar_url ?? null,
    };
  }
  const c = row.club;
  return {
    id: row.id,
    updated_at: row.updated_at,
    counterpart_name: c?.club_name || "Club",
    counterpart_subtitle: c?.city ?? null,
    counterpart_avatar: c?.logo_url ?? null,
  };
}

/** Lista de chats del usuario (RLS deja pasar solo los suyos), el más reciente primero. */
export async function getConversations(role: UserRole): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select(SELECT)
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as unknown as ConversationRow[];
  if (rows.length === 0) return [];

  const { data: msgs } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at")
    .in("conversation_id", rows.map((r) => r.id))
    .order("created_at", { ascending: false })
    .limit(300);

  const lastByConversation = new Map<string, string>();
  for (const m of msgs ?? []) {
    if (!lastByConversation.has(m.conversation_id)) lastByConversation.set(m.conversation_id, m.content);
  }

  return rows.map((row) => ({
    ...summarize(row, role),
    last_message: lastByConversation.get(row.id) ?? null,
  }));
}

export async function getConversation(id: string, role: UserRole) {
  const supabase = await createClient();
  const { data } = await supabase.from("conversations").select(SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as unknown as ConversationRow;
  return { ...summarize(row, role), player_id: row.player?.id ?? null };
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(500);
  return (data ?? []) as Message[];
}
