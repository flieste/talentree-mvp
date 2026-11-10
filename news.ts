import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { NewsItem } from "@/lib/types";

/**
 * Ordena para mostrar primero lo que viene: eventos futuros (o sin fecha) por
 * fecha ascendente, y después los ya pasados, del más reciente al más viejo.
 */
function sortForDisplay(items: NewsItem[]): NewsItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items
    .filter((n) => !n.event_date || n.event_date >= today)
    .sort((a, b) => (a.event_date ?? "9999").localeCompare(b.event_date ?? "9999"));
  const past = items
    .filter((n) => n.event_date && n.event_date < today)
    .sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));
  return [...upcoming, ...past];
}

/** Todas las noticias y eventos (para la página /news). */
export async function getAllNews(): Promise<NewsItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("news").select("*");
  return sortForDisplay((data ?? []) as NewsItem[]);
}

/** Las primeras `limit` noticias para el panel del Inicio. */
export async function getHomeNews(limit: number): Promise<NewsItem[]> {
  const all = await getAllNews();
  return all.slice(0, limit);
}
