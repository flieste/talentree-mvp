import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

/**
 * Rol del usuario autenticado (player | club | admin), o null si no hay sesión.
 * "admin" es el equipo de TalenTree: se decide en la base (función
 * is_talentree_admin, mail autorizado y confirmado), nunca por algo que el
 * usuario pueda editar.
 */
export async function getRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: isAdmin } = await supabase.rpc("is_talentree_admin");
  if (isAdmin === true) return "admin";

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return (data?.role as UserRole | undefined) ?? "player";
}
