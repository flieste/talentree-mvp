"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAdminClient } from "@/lib/data/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { NEWS_CATEGORY_LABELS, type NewsCategory } from "@/lib/types";
import { isSafeHttpUrl } from "@/lib/utils";

export interface AdminResult {
  error?: string;
  success?: boolean;
  /** Link de acceso para que el club elija su contraseña (se muestra en el panel). */
  accessLink?: string;
}

const NOT_ADMIN = "No tenés permiso para hacer esto.";
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

/** Link de un solo uso para que el club defina su contraseña y entre. */
async function buildAccessLink(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  const token = data?.properties?.hashed_token;
  if (error || !token) return null;
  const origin = await siteOrigin();
  return `${origin}/auth/confirm?token_hash=${encodeURIComponent(token)}&type=recovery&next=/actualizar-clave`;
}

/* ---------------------------------------------------------------------------
 * Solicitudes de cuenta de club
 * ------------------------------------------------------------------------- */

export async function approveClubRequest(requestId: string): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };

  const { data: req } = await ctx.supabase
    .from("club_requests")
    .select("id, club_name, city, contact_name, role_title, email, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) return { error: "No encontramos la solicitud." };
  if (req.status !== "pendiente") return { error: "Esa solicitud ya fue resuelta." };

  const admin = createAdminClient();
  const email = String(req.email).trim().toLowerCase();

  // app_metadata solo lo escribe la service role: el trigger handle_new_user
  // lo usa para crear la cuenta directamente como club (migración 0008).
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    app_metadata: { role: "club" },
    user_metadata: { club_name: req.club_name, city: req.city ?? "" },
  });
  if (createError || !created.user) {
    const exists = /already|registered|exists/i.test(createError?.message ?? "");
    return {
      error: exists
        ? "Ya existe una cuenta con ese email. Si es de un jugador, tiene que usar otro mail."
        : "No pudimos crear la cuenta del club.",
    };
  }

  // El contacto de la solicitud queda cargado como primer responsable.
  const { data: club } = await admin.from("clubs").select("id").eq("user_id", created.user.id).maybeSingle();
  if (club) {
    await admin.from("club_managers").insert({
      club_id: club.id,
      full_name: req.contact_name,
      role_title: req.role_title,
      email,
    });
  }

  const { error: updateError } = await ctx.supabase
    .from("club_requests")
    .update({ status: "aprobada" })
    .eq("id", requestId);
  if (updateError) console.error("[admin] no se pudo marcar aprobada:", updateError.message);

  const accessLink = await buildAccessLink(email);
  revalidatePath("/admin", "layout");
  return accessLink
    ? { success: true, accessLink }
    : { success: true, error: "Cuenta creada, pero no pudimos generar el link. Usá \"Generar link de acceso\"." };
}

export async function rejectClubRequest(requestId: string): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };
  const { error } = await ctx.supabase
    .from("club_requests")
    .update({ status: "rechazada" })
    .eq("id", requestId)
    .eq("status", "pendiente");
  if (error) return { error: "No pudimos rechazar la solicitud." };
  revalidatePath("/admin", "layout");
  return { success: true };
}

/** Nuevo link de acceso para un club ya aprobado (los links vencen). */
export async function regenerateAccessLink(requestId: string): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };
  const { data: req } = await ctx.supabase
    .from("club_requests")
    .select("email, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!req || req.status !== "aprobada") return { error: "La solicitud no está aprobada." };
  const accessLink = await buildAccessLink(String(req.email).trim().toLowerCase());
  return accessLink ? { success: true, accessLink } : { error: "No pudimos generar el link." };
}

/* ---------------------------------------------------------------------------
 * Avisos que mandan los clubes
 * ------------------------------------------------------------------------- */

export async function publishAnnouncement(announcementId: string): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };

  const { data: a } = await ctx.supabase
    .from("club_announcements")
    .select("*, club:clubs(club_name)")
    .eq("id", announcementId)
    .maybeSingle();
  if (!a) return { error: "No encontramos el aviso." };
  if (a.status === "publicado") return { error: "Ese aviso ya está publicado." };

  const clubName = (a.club as { club_name?: string } | null)?.club_name;
  const { error: newsError } = await ctx.supabase.from("news").insert({
    title: a.title,
    description: a.description,
    category: a.category,
    event_date: a.proposed_date,
    location: a.location ?? clubName ?? null,
  });
  if (newsError) return { error: "No pudimos publicar la noticia." };

  const { error } = await ctx.supabase
    .from("club_announcements")
    .update({ status: "publicado", team_note: null })
    .eq("id", announcementId);
  if (error) return { error: "Se publicó la noticia pero no pudimos actualizar el estado del aviso." };

  revalidatePath("/admin", "layout");
  revalidatePath("/news");
  revalidatePath("/inicio");
  return { success: true };
}

export async function rejectAnnouncement(announcementId: string, note: string): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };
  const clean = note.trim();
  if (clean.length > 500) return { error: "La nota no puede superar los 500 caracteres." };
  const { error } = await ctx.supabase
    .from("club_announcements")
    .update({ status: "rechazado", team_note: clean || null })
    .eq("id", announcementId)
    .neq("status", "publicado");
  if (error) return { error: "No pudimos actualizar el aviso." };
  revalidatePath("/admin", "layout");
  return { success: true };
}

export async function reopenAnnouncement(announcementId: string): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };
  const { error } = await ctx.supabase
    .from("club_announcements")
    .update({ status: "pendiente", team_note: null })
    .eq("id", announcementId)
    .eq("status", "rechazado");
  if (error) return { error: "No pudimos volver el aviso a revisión." };
  revalidatePath("/admin", "layout");
  return { success: true };
}

/* ---------------------------------------------------------------------------
 * Noticias y eventos propios de TalenTree
 * ------------------------------------------------------------------------- */

function readNews(fd: FormData): { error: string } | { values: Record<string, string | null> } {
  const title = text(fd, "title");
  const category = text(fd, "category") as NewsCategory;
  const eventDate = text(fd, "eventDate");
  const linkUrl = text(fd, "linkUrl");

  if (!title) return { error: "El título es obligatorio." };
  if (title.length > 150) return { error: "El título es demasiado largo (máx. 150)." };
  if (!(category in NEWS_CATEGORY_LABELS)) return { error: "Elegí un tipo." };
  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return { error: "La fecha no es válida." };
  if (linkUrl && !isSafeHttpUrl(linkUrl)) return { error: "El link tiene que empezar con http:// o https://." };
  const description = text(fd, "description");
  if (description.length > 1000) return { error: "La descripción es demasiado larga (máx. 1000)." };

  return {
    values: {
      title,
      category,
      event_date: eventDate || null,
      location: text(fd, "location") || null,
      description: description || null,
      link_url: linkUrl || null,
    },
  };
}

export async function createNews(formData: FormData): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };
  const parsed = readNews(formData);
  if ("error" in parsed) return parsed;
  const { error } = await ctx.supabase.from("news").insert(parsed.values);
  if (error) return { error: "No pudimos publicar." };
  revalidatePath("/admin", "layout");
  revalidatePath("/news");
  revalidatePath("/inicio");
  return { success: true };
}

export async function updateNews(id: string, formData: FormData): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };
  const parsed = readNews(formData);
  if ("error" in parsed) return parsed;
  const { error } = await ctx.supabase.from("news").update(parsed.values).eq("id", id);
  if (error) return { error: "No pudimos guardar los cambios." };
  revalidatePath("/admin", "layout");
  revalidatePath("/news");
  revalidatePath("/inicio");
  return { success: true };
}

export async function deleteNews(id: string): Promise<AdminResult> {
  const ctx = await getAdminClient();
  if (!ctx) return { error: NOT_ADMIN };
  const { error } = await ctx.supabase.from("news").delete().eq("id", id);
  if (error) return { error: "No pudimos eliminar." };
  revalidatePath("/admin", "layout");
  revalidatePath("/news");
  revalidatePath("/inicio");
  return { success: true };
}
