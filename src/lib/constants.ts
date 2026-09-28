export const SUPPORT_EMAIL = "support@talentree.app";
export const APP_NAME = "TalenTree";

export const TAGLINE =
  "En TalenTree potenciamos la búsqueda de talentos a lo largo y ancho del país, con el objetivo de generar oportunidades reales para todos.";

/** Cantidad de noticias que se muestran en el panel del Inicio. */
export const HOME_NEWS_LIMIT = 4;

/** Videos subidos como archivo: bucket de Supabase Storage y límites. */
export const VIDEO_BUCKET = "highlight-videos";
export const MAX_VIDEO_FILE_MB = 50; // límite del plan gratuito de Supabase
export const ACCEPTED_VIDEO_MIME = ["video/mp4", "video/quicktime", "video/webm"];

/** Foto de perfil: bucket de Supabase Storage y límites. */
export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_MB = 5;
export const ACCEPTED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"];
