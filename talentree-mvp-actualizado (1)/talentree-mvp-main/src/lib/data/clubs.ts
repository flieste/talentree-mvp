import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Club, ClubAnnouncement, ClubManager } from "@/lib/types";

/** Club del usuario autenticado (o null si todavía no existe). */
export async function getCurrentClub(): Promise<Club | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("clubs")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as Club | null;
}

export async function getClubManagers(clubId: string): Promise<ClubManager[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_managers")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: true });
  return (data ?? []) as ClubManager[];
}

export async function getClubAnnouncements(clubId: string): Promise<ClubAnnouncement[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("club_announcements")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ClubAnnouncement[];
}
