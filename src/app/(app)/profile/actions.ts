"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidVideoUrl } from "@/lib/utils";
import { AVATAR_BUCKET, VIDEO_BUCKET } from "@/lib/constants";
import { storagePathFromUrl } from "@/lib/storage";
import type { PlayerPosition } from "@/lib/types";

interface ActionResult {
  error?: string;
  success?: boolean;
}

async function getAuthedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Confirma que `playerId` es realmente el perfil de jugador del usuario
 * autenticado. Lo usamos como chequeo explícito en el código (no solo
 * confiar en RLS) antes de tocar filas relacionadas como videos o clubes
 * anteriores, así la protección no depende de una sola capa.
 */
async function assertOwnsPlayer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function updatePlayerProfile(
  playerId: string,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "");
  const currentClub = String(formData.get("currentClub") ?? "").trim();
  const heightRaw = String(formData.get("height") ?? "").trim();
  const weightRaw = String(formData.get("weight") ?? "").trim();
  const position = String(formData.get("position") ?? "") as PlayerPosition | "";
  const nationality = String(formData.get("nationality") ?? "").trim();

  if (!firstName) return { error: "El nombre es obligatorio." };
  if (!lastName) return { error: "El apellido es obligatorio." };

  const parsedBirthDate = new Date(birthDate);
  if (!birthDate || Number.isNaN(parsedBirthDate.getTime())) {
    return { error: "La fecha de nacimiento no es válida." };
  }

  let height: number | null = null;
  if (heightRaw) {
    height = Number(heightRaw);
    if (!Number.isFinite(height) || height <= 0) {
      return { error: "La estatura no es válida." };
    }
  }

  let weight: number | null = null;
  if (weightRaw) {
    weight = Number(weightRaw);
    if (!Number.isFinite(weight) || weight <= 0) {
      return { error: "El peso debe ser un número positivo (en kg)." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("players")
    .update({
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDate,
      current_club: currentClub || null,
      height_cm: height,
      weight_kg: weight,
      position: position || null,
      nationality: nationality || null,
    })
    .eq("id", playerId)
    .eq("user_id", userId);

  if (error) return { error: "No pudimos guardar los cambios." };

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}

export async function addPreviousClub(
  playerId: string,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };

  const clubName = String(formData.get("clubName") ?? "").trim();
  const startDate = String(formData.get("startDate") ?? "") || null;
  const endDate = String(formData.get("endDate") ?? "") || null;

  if (!clubName) return { error: "El nombre del club es obligatorio." };

  const supabase = await createClient();
  if (!(await assertOwnsPlayer(supabase, playerId, userId))) {
    return { error: "No encontramos tu perfil." };
  }

  const { error } = await supabase.from("previous_clubs").insert({
    player_id: playerId,
    club_name: clubName,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) return { error: "No pudimos agregar el club." };

  revalidatePath("/profile");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}

export async function deletePreviousClub(
  clubRowId: string,
  playerId: string,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };

  const supabase = await createClient();
  if (!(await assertOwnsPlayer(supabase, playerId, userId))) {
    return { error: "No encontramos tu perfil." };
  }

  const { error } = await supabase
    .from("previous_clubs")
    .delete()
    .eq("id", clubRowId)
    .eq("player_id", playerId);

  if (error) return { error: "No pudimos eliminar el club." };

  revalidatePath("/profile");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}

export async function addHighlightVideo(
  playerId: string,
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!title) return { error: "El título es obligatorio." };
  if (!isValidVideoUrl(url)) {
    return { error: "Ingresá una URL válida de YouTube o Vimeo." };
  }

  const supabase = await createClient();
  if (!(await assertOwnsPlayer(supabase, playerId, userId))) {
    return { error: "No encontramos tu perfil." };
  }

  const { error } = await supabase.from("highlight_videos").insert({
    player_id: playerId,
    title,
    url,
    source: "url",
  });

  if (error) return { error: "No pudimos agregar el video." };

  revalidatePath("/profile");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}

/**
 * Registra un video que el jugador ya subió al bucket de Storage desde el
 * navegador. Se valida que el archivo esté en la carpeta del propio usuario.
 */
export async function addHighlightVideoFile(
  playerId: string,
  title: string,
  storagePath: string,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };

  const cleanTitle = title.trim();
  if (!cleanTitle) return { error: "El título es obligatorio." };
  if (!storagePath.startsWith(`${userId}/`) || storagePath.includes("..")) {
    return { error: "El archivo no es válido." };
  }

  const supabase = await createClient();
  if (!(await assertOwnsPlayer(supabase, playerId, userId))) {
    await supabase.storage.from(VIDEO_BUCKET).remove([storagePath]);
    return { error: "No encontramos tu perfil." };
  }

  const { data } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(storagePath);

  const { error } = await supabase.from("highlight_videos").insert({
    player_id: playerId,
    title: cleanTitle,
    url: data.publicUrl,
    source: "file",
    storage_path: storagePath,
  });

  if (error) {
    // Evita dejar un archivo huérfano en Storage si no se pudo guardar el registro.
    await supabase.storage.from(VIDEO_BUCKET).remove([storagePath]);
    return { error: "No pudimos agregar el video." };
  }

  revalidatePath("/profile");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}

export async function deleteHighlightVideo(
  videoId: string,
  playerId: string,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };

  const supabase = await createClient();
  if (!(await assertOwnsPlayer(supabase, playerId, userId))) {
    return { error: "No encontramos tu perfil." };
  }

  const { data: video } = await supabase
    .from("highlight_videos")
    .select("source, storage_path")
    .eq("id", videoId)
    .eq("player_id", playerId)
    .maybeSingle();

  const { error } = await supabase
    .from("highlight_videos")
    .delete()
    .eq("id", videoId)
    .eq("player_id", playerId);

  if (error) return { error: "No pudimos eliminar el video." };

  if (video?.source === "file" && video.storage_path) {
    await supabase.storage.from(VIDEO_BUCKET).remove([video.storage_path]);
  }

  revalidatePath("/profile");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}

/**
 * Guarda la foto de perfil que el jugador ya subió al bucket desde el navegador
 * y borra la anterior para no acumular archivos.
 */
export async function updateAvatar(
  playerId: string,
  storagePath: string,
): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };
  if (!storagePath.startsWith(`${userId}/`) || storagePath.includes("..")) {
    return { error: "El archivo no es válido." };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("players")
    .select("avatar_url")
    .eq("id", playerId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!current) {
    await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
    return { error: "No encontramos tu perfil." };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
  const { error } = await supabase
    .from("players")
    .update({ avatar_url: data.publicUrl })
    .eq("id", playerId)
    .eq("user_id", userId);

  if (error) {
    await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
    return { error: "No pudimos guardar la foto." };
  }

  const oldPath = storagePathFromUrl(current.avatar_url, AVATAR_BUCKET);
  if (oldPath && oldPath !== storagePath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}

export async function removeAvatar(playerId: string): Promise<ActionResult> {
  const userId = await getAuthedUserId();
  if (!userId) return { error: "Tenés que iniciar sesión." };

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("players")
    .select("avatar_url")
    .eq("id", playerId)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("players")
    .update({ avatar_url: null })
    .eq("id", playerId)
    .eq("user_id", userId);
  if (error) return { error: "No pudimos quitar la foto." };

  const oldPath = storagePathFromUrl(current?.avatar_url, AVATAR_BUCKET);
  if (oldPath) await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);

  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath(`/player/${playerId}`);
  return { success: true };
}
