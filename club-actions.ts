"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils";
import { AVATAR_BUCKET } from "@/lib/constants";
import { storagePathFromUrl } from "@/lib/storage";
import { NEWS_CATEGORY_LABELS, type NewsCategory } from "@/lib/types";

interface ActionResult {
  error?: string;
  success?: boolean;
}

/** Id del club del usuario autenticado (null si no hay sesión o no es un club). */
async function getMyClubId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("clubs").select("id").eq("user_id", user.id).maybeSingle();
  return data?.id ?? null;
}

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function updateClub(formData: FormData): Promise<ActionResult> {
  const clubId = await getMyClubId();
  if (!clubId) return { error: "Tenés que iniciar sesión con la cuenta del club." };

  const clubName = text(formData, "clubName");
  if (!clubName) return { error: "El nombre del club es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("clubs")
    .update({
      club_name: clubName,
      city: text(formData, "city") || null,
      description: text(formData, "description") || null,
    })
    .eq("id", clubId);

  if (error) return { error: "No pudimos guardar los cambios." };
  revalidatePath("/profile");
  return { success: true };
}

export async function addManager(formData: FormData): Promise<ActionResult> {
  const clubId = await getMyClubId();
  if (!clubId) return { error: "Tenés que iniciar sesión con la cuenta del club." };

  const fullName = text(formData, "fullName");
  const email = text(formData, "email").toLowerCase();
  if (!fullName) return { error: "El nombre es obligatorio." };
  if (!isValidEmail(email)) return { error: "Ingresá un email válido." };

  const supabase = await createClient();
  const { error } = await supabase.from("club_managers").insert({
    club_id: clubId,
    full_name: fullName,
    role_title: text(formData, "roleTitle") || null,
    email,
  });

  if (error) {
    // 23505 = unique_violation (mismo email cargado dos veces en el mismo club)
    if (error.code === "23505") return { error: "Ese email ya está cargado." };
    return { error: "No pudimos agregar al responsable." };
  }
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteManager(managerId: string): Promise<ActionResult> {
  const clubId = await getMyClubId();
  if (!clubId) return { error: "Tenés que iniciar sesión con la cuenta del club." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("club_managers")
    .delete()
    .eq("id", managerId)
    .eq("club_id", clubId);

  if (error) return { error: "No pudimos eliminar al responsable." };
  revalidatePath("/profile");
  return { success: true };
}

export async function addAnnouncement(formData: FormData): Promise<ActionResult> {
  const clubId = await getMyClubId();
  if (!clubId) return { error: "Tenés que iniciar sesión con la cuenta del club." };

  const title = text(formData, "title");
  const category = text(formData, "category") as NewsCategory;
  const proposedDate = text(formData, "proposedDate") || null;

  if (!title) return { error: "El título es obligatorio." };
  if (!(category in NEWS_CATEGORY_LABELS)) return { error: "Elegí un tipo de aviso." };
  if (proposedDate && Number.isNaN(new Date(proposedDate).getTime())) {
    return { error: "La fecha no es válida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("club_announcements").insert({
    club_id: clubId,
    title,
    category,
    proposed_date: proposedDate,
    location: text(formData, "location") || null,
    description: text(formData, "description") || null,
  });

  if (error) return { error: "No pudimos enviar el aviso." };
  revalidatePath("/profile");
  return { success: true };
}

export async function deleteAnnouncement(announcementId: string): Promise<ActionResult> {
  const clubId = await getMyClubId();
  if (!clubId) return { error: "Tenés que iniciar sesión con la cuenta del club." };

  const supabase = await createClient();
  // La política RLS solo deja borrar avisos que siguen pendientes.
  const { error } = await supabase
    .from("club_announcements")
    .delete()
    .eq("id", announcementId)
    .eq("club_id", clubId);

  if (error) return { error: "No pudimos retirar el aviso." };
  revalidatePath("/profile");
  return { success: true };
}

/**
 * Guarda el escudo del club que ya se subió al bucket desde el navegador
 * y borra el anterior para no acumular archivos.
 */
export async function updateClubLogo(storagePath: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión con la cuenta del club." };
  if (!storagePath.startsWith(`${user.id}/`) || storagePath.includes("..")) {
    return { error: "El archivo no es válido." };
  }

  const { data: club } = await supabase
    .from("clubs")
    .select("id, logo_url")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!club) {
    await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
    return { error: "No encontramos el perfil de tu club." };
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
  const { error } = await supabase
    .from("clubs")
    .update({ logo_url: data.publicUrl })
    .eq("id", club.id);

  if (error) {
    await supabase.storage.from(AVATAR_BUCKET).remove([storagePath]);
    return { error: "No pudimos guardar el escudo." };
  }

  const oldPath = storagePathFromUrl(club.logo_url, AVATAR_BUCKET);
  if (oldPath && oldPath !== storagePath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);
  }

  revalidatePath("/profile");
  revalidatePath("/chat");
  return { success: true };
}

export async function removeClubLogo(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión con la cuenta del club." };

  const { data: club } = await supabase
    .from("clubs")
    .select("id, logo_url")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!club) return { error: "No encontramos el perfil de tu club." };

  const { error } = await supabase.from("clubs").update({ logo_url: null }).eq("id", club.id);
  if (error) return { error: "No pudimos quitar el escudo." };

  const oldPath = storagePathFromUrl(club.logo_url, AVATAR_BUCKET);
  if (oldPath) await supabase.storage.from(AVATAR_BUCKET).remove([oldPath]);

  revalidatePath("/profile");
  revalidatePath("/chat");
  return { success: true };
}
