import { getAllPlayers } from "@/lib/data/players";
import { getHomeNews } from "@/lib/data/news";
import { HOME_NEWS_LIMIT, TAGLINE } from "@/lib/constants";
import { Logo } from "@/components/Logo";
import { NewsPanel } from "@/components/NewsPanel";
import { PlayerCard } from "@/components/PlayerCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function HomePage() {
  const [players, news] = await Promise.all([
    getAllPlayers(),
    getHomeNews(HOME_NEWS_LIMIT),
  ]);

  return (
    <div className="flex flex-col gap-8">
      {/* Logo completo (única pantalla donde aparece con el nombre) + frase */}
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo size="xl" />
        <p className="max-w-xl text-balance text-base italic text-brand sm:text-lg">
          {TAGLINE}
        </p>
      </div>

      <NewsPanel items={news} />

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Descubrí nuevos talentos
          </h1>
          <p className="mt-1 text-text-muted">
            Explorá perfiles de jugadores y conocé su trayectoria.
          </p>
        </div>

        {players.length === 0 ? (
          <EmptyState
            title="Todavía no hay jugadores para mostrar."
            description="Los perfiles de jugadores van a aparecer acá apenas se registren."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
