"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getRole } from "@/lib/data/auth";
import type { Message } from "@/lib/types";

const MAX_MESSAGE_LENGTH = 2000;

/**
 * Un club abre (o retoma) el chat con un jugador. Hay una única conversación
 * por par club-jugador, así que si ya existe se reutiliza.
 */
export async function startConversation(playerId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión." };
  if ((await getRole()) !== "club") {
    return { error: "Solo los clubes pueden iniciar una conversación." };
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!club) return { error: "No encontramos el perfil de tu club." };

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("club_id", club.id)
    .eq("player_id", playerId)
    .maybeSingle();

  let conversationId = existing?.id as string | undefined;
  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ club_id: club.id, player_id: playerId })
      .select("id")
      .single();
    if (error || !created) return { error: "No pudimos abrir la conversación." };
    conversationId = created.id;
  }

  revalidatePath("/chat");
  redirect(`/chat/${conversationId}`);
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<{ error?: string; message?: Message }> {
  const text = content.trim();
  if (!text) return { error: "Escribí un mensaje." };
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { error: `El mensaje es muy largo (máximo ${MAX_MESSAGE_LENGTH} caracteres).` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = await getRole();
  if (!user || !role) return { error: "Tenés que iniciar sesión." };

  // La política RLS garantiza que solo participantes de la conversación puedan escribir.
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_type: role,
      content: text,
    })
    .select("*")
    .single();

  if (error || !data) return { error: "No pudimos enviar el mensaje." };

  revalidatePath("/chat");
  return { message: data as Message };
}
