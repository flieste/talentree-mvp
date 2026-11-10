import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

/** Rol del usuario autenticado (player | club), o null si no hay sesión. */
export async function getRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return (data?.role as UserRole | undefined) ?? "player";
}
