export type UserRole = "player" | "club";

export type PlayerPosition =
  | "arquero"
  | "defensor"
  | "mediocampista"
  | "delantero";

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  user_id: string | null;
  first_name: string;
  last_name: string;
  birth_date: string; // ISO date (yyyy-mm-dd)
  current_club: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  position: PlayerPosition | null;
  avatar_url: string | null;
  nationality: string | null;
  /** Calificación de 0 a 10 asignada por el equipo de TalenTree. */
  rating: number | null;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreviousClub {
  id: string;
  player_id: string;
  club_name: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export type VideoSource = "url" | "file";

export interface HighlightVideo {
  id: string;
  player_id: string;
  title: string;
  /** Link de YouTube/Vimeo (source = "url") o URL pública del archivo subido (source = "file"). */
  url: string;
  source: VideoSource;
  /** Ruta dentro del bucket de Storage; solo existe cuando source = "file". */
  storage_path: string | null;
  created_at: string;
}

export type NewsCategory =
  | "prueba_club"
  | "prueba_privada"
  | "torneo"
  | "evento"
  | "noticia";

export interface NewsItem {
  id: string;
  title: string;
  description: string | null;
  category: NewsCategory;
  /** Fecha del evento (yyyy-mm-dd). Null para noticias sin fecha. */
  event_date: string | null;
  location: string | null;
  link_url: string | null;
  created_at: string;
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  prueba_club: "Prueba en club",
  prueba_privada: "Prueba privada",
  torneo: "Torneo",
  evento: "Evento",
  noticia: "Noticia",
};

export interface PlayerWithRelations extends Player {
  previous_clubs: PreviousClub[];
  highlight_videos: HighlightVideo[];
}

export const POSITION_LABELS: Record<PlayerPosition, string> = {
  arquero: "Arquero",
  defensor: "Defensor",
  mediocampista: "Mediocampista",
  delantero: "Delantero",
};

export const POSITION_OPTIONS: { value: PlayerPosition; label: string }[] =
  Object.entries(POSITION_LABELS).map(([value, label]) => ({
    value: value as PlayerPosition,
    label,
  }));

export interface Club {
  id: string;
  user_id: string | null;
  club_name: string;
  logo_url: string | null;
  city: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClubManager {
  id: string;
  club_id: string;
  full_name: string;
  role_title: string | null;
  email: string;
  created_at: string;
}

export type AnnouncementStatus = "pendiente" | "publicado" | "rechazado";

export interface ClubAnnouncement {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  category: NewsCategory;
  proposed_date: string | null;
  location: string | null;
  status: AnnouncementStatus;
  team_note: string | null;
  created_at: string;
}

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  pendiente: "En revisión",
  publicado: "Publicado",
  rechazado: "No publicado",
};

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: UserRole;
  content: string;
  created_at: string;
}

/** Fila de la lista de chats, ya con los datos de la otra persona. */
export interface ConversationSummary {
  id: string;
  updated_at: string;
  counterpart_name: string;
  counterpart_subtitle: string | null;
  counterpart_avatar: string | null;
  last_message: string | null;
}
