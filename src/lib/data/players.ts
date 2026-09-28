import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  HighlightVideo,
  Player,
  PlayerPosition,
  PlayerWithRelations,
  PreviousClub,
} from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Perfil de jugador del usuario autenticado (o null si todavía no existe). */
export async function getCurrentPlayer(): Promise<Player | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return data as Player | null;
}

/** Todos los jugadores para el grid de "Inicio", más recientes primero. */
export async function getAllPlayers(): Promise<Player[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });

  return (data ?? []) as Player[];
}

/** Perfil público de un jugador con sus clubes anteriores y highlights. */
export async function getPlayerWithRelations(
  id: string,
): Promise<PlayerWithRelations | null> {
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!player) return null;

  const [{ data: previousClubs }, { data: videos }] = await Promise.all([
    supabase
      .from("previous_clubs")
      .select("*")
      .eq("player_id", id)
      .order("start_date", { ascending: true }),
    supabase
      .from("highlight_videos")
      .select("*")
      .eq("player_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    ...(player as Player),
    previous_clubs: (previousClubs ?? []) as PreviousClub[],
    highlight_videos: (videos ?? []) as HighlightVideo[],
  };
}

export interface PlayerFilters {
  q?: string;
  position?: PlayerPosition;
  ageMin?: number;
  ageMax?: number;
  ratingMin?: number;
  nationality?: string;
  club?: string;
}

/** yyyy-mm-dd en horario local (evita el corrimiento de UTC-3 de toISOString). */
function toLocalIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Saca los caracteres que rompen la sintaxis de filtros de PostgREST (, ( ) % * "). */
function cleanTerm(value: string): string {
  return value.replace(/[,()%*"\\]/g, " ").trim();
}

/**
 * Búsqueda de jugadores para clubes. Todas las condiciones se combinan (AND):
 * cada palabra del nombre tiene que aparecer en el nombre o en el apellido.
 */
export async function searchPlayers(filters: PlayerFilters): Promise<Player[]> {
  const supabase = await createClient();
  let query = supabase.from("players").select("*");

  if (filters.q) {
    for (const word of cleanTerm(filters.q).split(/\s+/).filter(Boolean)) {
      query = query.or(`first_name.ilike.%${word}%,last_name.ilike.%${word}%`);
    }
  }
  if (filters.position) query = query.eq("position", filters.position);
  if (filters.nationality) query = query.eq("nationality", filters.nationality);
  if (filters.club) {
    const club = cleanTerm(filters.club);
    if (club) query = query.ilike("current_club", `%${club}%`);
  }
  if (filters.ratingMin !== undefined) query = query.gte("rating", filters.ratingMin);

  // Edad -> rango de fecha de nacimiento.
  const today = new Date();
  if (filters.ageMin !== undefined) {
    const latest = new Date(today.getFullYear() - filters.ageMin, today.getMonth(), today.getDate());
    query = query.lte("birth_date", toLocalIso(latest));
  }
  if (filters.ageMax !== undefined) {
    const earliest = new Date(today.getFullYear() - filters.ageMax - 1, today.getMonth(), today.getDate() + 1);
    query = query.gte("birth_date", toLocalIso(earliest));
  }

  const { data } = await query
    .order("rating", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(60);

  return (data ?? []) as Player[];
}

/** Nacionalidades cargadas, para el desplegable del filtro. */
export async function getNationalities(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("players").select("nationality").not("nationality", "is", null);
  const set = new Set((data ?? []).map((r) => String(r.nationality)).filter(Boolean));
  return [...set].sort((a, b) => a.localeCompare(b, "es"));
}
