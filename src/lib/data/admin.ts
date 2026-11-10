import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ClubAnnouncement, ClubManager, NewsItem } from "@/lib/types";

/**
 * Verifica (contra la base) que la sesión actual es de un mail autorizado.
 * Devuelve el cliente de Supabase de esa sesión, o null si no es admin.
 */
export async function getAdminClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.rpc("is_talentree_admin");
  return data === true ? { supabase, user } : null;
}

/** Para páginas: si no es admin, vuelve al inicio sin revelar que existe el panel. */
export async function requireAdmin() {
  const admin = await getAdminClient();
  if (!admin) redirect("/inicio");
  return admin;
}

export type RequestStatus = "pendiente" | "aprobada" | "rechazada";

export interface ClubRequest {
  id: string;
  created_at: string;
  club_name: string;
  city: string | null;
  contact_name: string;
  role_title: string | null;
  email: string;
  phone: string | null;
  message: string | null;
  status: RequestStatus;
}

export async function getClubRequests(): Promise<ClubRequest[]> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("club_requests")
    .select("id, created_at, club_name, city, contact_name, role_title, email, phone, message, status")
    .order("created_at", { ascending: false });
  return (data ?? []) as ClubRequest[];
}

export interface AdminAnnouncement extends ClubAnnouncement {
  club: { club_name: string; city: string | null } | null;
  contacts: Pick<ClubManager, "full_name" | "role_title" | "email">[];
}

export async function getAllAnnouncements(): Promise<AdminAnnouncement[]> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("club_announcements")
    .select("*, club:clubs(club_name, city)")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as (ClubAnnouncement & { club: AdminAnnouncement["club"] })[];

  const clubIds = [...new Set(rows.map((r) => r.club_id))];
  const { data: managers } = clubIds.length
    ? await supabase
        .from("club_managers")
        .select("club_id, full_name, role_title, email")
        .in("club_id", clubIds)
    : { data: [] };
  const byClub = new Map<string, AdminAnnouncement["contacts"]>();
  for (const m of (managers ?? []) as (ClubManager & { club_id: string })[]) {
    byClub.set(m.club_id, [...(byClub.get(m.club_id) ?? []), m]);
  }
  return rows.map((r) => ({ ...r, contacts: byClub.get(r.club_id) ?? [] }));
}

export async function getAdminNews(): Promise<NewsItem[]> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as NewsItem[];
}

export async function getAdminCounts() {
  const { supabase } = await requireAdmin();
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const [requests, announcements, news] = await Promise.all([
    count(supabase.from("club_requests").select("id", { count: "exact", head: true }).eq("status", "pendiente")),
    count(supabase.from("club_announcements").select("id", { count: "exact", head: true }).eq("status", "pendiente")),
    count(supabase.from("news").select("id", { count: "exact", head: true })),
  ]);
  return { requests, announcements, news };
}
