import type { NewsItem } from "@/lib/types";
import { NEWS_CATEGORY_LABELS } from "@/lib/types";
import { cn, isSafeHttpUrl, parseLocalDate } from "@/lib/utils";

function DateBadge({ date, featured }: { date: string | null; featured?: boolean }) {
  const d = parseLocalDate(date);
  const size = featured ? "h-14 w-14" : "h-12 w-12";
  if (!d) {
    return (
      <div className={cn("news-date flex shrink-0 items-center justify-center rounded text-lg", size)}>
        ★
      </div>
    );
  }
  const month = d.toLocaleDateString("es-AR", { month: "short" }).replace(".", "");
  return (
    <div
      className={cn(
        "news-date flex shrink-0 flex-col items-center justify-center rounded leading-none",
        size,
      )}
    >
      <span className="font-display text-xl font-semibold">{d.getDate()}</span>
      <span className="text-[0.65rem] uppercase tracking-wide">{month}</span>
    </div>
  );
}

/**
 * Tarjeta de una noticia/evento. `featured` es la versión grande que se usa
 * en el carrusel del Inicio (una noticia por slide); sin `featured` se usa en
 * el listado completo de /news.
 */
export function NewsItemCard({ item, featured }: { item: NewsItem; featured?: boolean }) {
  const meta = [
    item.location,
    item.event_date &&
      parseLocalDate(item.event_date)?.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article id={item.id} className={cn("news-item flex gap-3", featured ? "p-4 sm:px-14 sm:py-5" : "p-3")}>
      <DateBadge date={item.event_date} featured={featured} />
      <div className="min-w-0 flex-1">
        <span className="news-chip inline-block rounded-sm px-1.5 py-0.5 text-[0.7rem] font-medium">
          {NEWS_CATEGORY_LABELS[item.category]}
        </span>
        <h3
          className={cn(
            "mt-1 font-display font-semibold leading-snug text-[var(--news-gold)]",
            featured ? "text-2xl" : "text-lg",
          )}
        >
          {item.title}
        </h3>
        {meta && <p className="text-xs text-[var(--news-gold-soft)]/80 sm:text-sm">{meta}</p>}
        {item.description && (
          <p
            className={cn(
              "mt-1 text-sm text-[var(--news-gold-soft)] sm:text-base",
              !featured && "line-clamp-2",
            )}
          >
            {item.description}
          </p>
        )}
        {item.link_url && isSafeHttpUrl(item.link_url) && (
          <a
            href={item.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-panel__link mt-1 inline-block text-sm font-medium underline-offset-2 hover:underline"
          >
            Más info
          </a>
        )}
      </div>
    </article>
  );
}
