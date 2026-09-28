import { getAllNews } from "@/lib/data/news";
import { NewsItemCard } from "@/components/NewsItemCard";

export const metadata = { title: "Noticias y eventos — TalenTree" };

export default async function NewsPage() {
  const news = await getAllNews();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Noticias y eventos
        </h1>
        <p className="mt-1 text-text-muted">
          Pruebas en clubes, pruebas privadas y todo lo que se viene.
        </p>
      </div>

      {news.length === 0 ? (
        <div className="news-panel p-8 pl-9 text-center">
          <p className="font-display text-2xl italic text-[var(--news-gold)]">Próximamente...</p>
          <p className="mt-1 text-sm text-[var(--news-gold-soft)]/80">
            Todavía no hay noticias ni eventos cargados.
          </p>
        </div>
      ) : (
        <div className="news-panel p-4 pl-5 sm:p-5 sm:pl-6">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {news.map((item) => (
              <NewsItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
