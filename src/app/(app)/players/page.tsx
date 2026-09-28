import { redirect } from "next/navigation";
import { getRole } from "@/lib/data/auth";
import { getNationalities, searchPlayers, type PlayerFilters } from "@/lib/data/players";
import { PlayerCard } from "@/components/PlayerCard";
import { PlayerSearchForm } from "@/components/PlayerSearchForm";
import { EmptyState } from "@/components/ui/EmptyState";
import { POSITION_LABELS, type PlayerPosition } from "@/lib/types";

export const metadata = { title: "Buscar jugadores — TalenTree" };

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const num = (v: string) => {
  const n = Number(v);
  return v !== "" && Number.isFinite(n) ? n : undefined;
};

export default async function PlayersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  // Solo los clubes buscan jugadores.
  if ((await getRole()) !== "club") redirect("/");

  const sp = await searchParams;
  const values = {
    q: one(sp.q),
    position: one(sp.position),
    ageMin: one(sp.ageMin),
    ageMax: one(sp.ageMax),
    rating: one(sp.rating),
    nationality: one(sp.nationality),
    club: one(sp.club),
  };

  const filters: PlayerFilters = {
    q: values.q || undefined,
    position: values.position in POSITION_LABELS ? (values.position as PlayerPosition) : undefined,
    ageMin: num(values.ageMin),
    ageMax: num(values.ageMax),
    ratingMin: num(values.rating),
    nationality: values.nationality || undefined,
    club: values.club || undefined,
  };
  const hasFilters = Object.values(values).some(Boolean);

  const [players, nationalities] = await Promise.all([searchPlayers(filters), getNationalities()]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Buscar jugadores
        </h1>
        <p className="mt-1 text-text-muted">
          Buscá por nombre y filtrá por edad, posición, calificación, nacionalidad o club.
        </p>
      </div>

      <PlayerSearchForm values={values} nationalities={nationalities} hasFilters={hasFilters} />

      <p className="text-sm text-text-muted" aria-live="polite">
        {players.length === 1 ? "1 jugador" : `${players.length} jugadores`}
        {hasFilters ? " con estos filtros" : ""}
      </p>

      {players.length === 0 ? (
        <EmptyState
          title="No encontramos jugadores con esos filtros."
          description="Probá ampliando el rango de edad o sacando algún filtro."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  );
}
