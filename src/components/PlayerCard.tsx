import Link from "next/link";
import type { Player } from "@/lib/types";
import { POSITION_LABELS } from "@/lib/types";
import { calculateAge, formatHeight, fullName } from "@/lib/utils";
import { Avatar } from "@/components/Avatar";

export function PlayerCard({ player }: { player: Player }) {
  const age = calculateAge(player.birth_date);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent">
      <div className="flex items-center gap-3">
        <Avatar player={player} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-display text-lg font-semibold leading-tight">
            {fullName(player)}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {player.position && (
              <span className="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-strong">
                {POSITION_LABELS[player.position]}
              </span>
            )}
            {player.nationality && (
              <span className="text-xs text-text-muted">{player.nationality}</span>
            )}
          </div>
        </div>
        {player.rating !== null && (
          <span
            title="Calificación de TalenTree"
            className="shrink-0 self-start rounded-md bg-bg-subtle px-2 py-1 font-display text-sm font-semibold"
          >
            ★ {player.rating.toFixed(1)}
          </span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-2 border-y border-border py-3 text-center text-sm">
        <div>
          <dt className="text-xs text-text-muted">Edad</dt>
          <dd className="font-medium">{age}</dd>
        </div>
        <div className="truncate">
          <dt className="text-xs text-text-muted">Club</dt>
          <dd className="truncate font-medium">{player.current_club || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-text-muted">Altura</dt>
          <dd className="font-medium">{formatHeight(player.height_cm)}</dd>
        </div>
      </dl>

      <Link
        href={`/player/${player.id}`}
        className="mt-auto inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong"
      >
        Ver perfil
      </Link>
    </article>
  );
}
