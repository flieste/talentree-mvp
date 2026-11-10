import type { PlayerWithRelations, UserRole } from "@/lib/types";
import { POSITION_LABELS } from "@/lib/types";
import { calculateAge, formatHeight, formatWeight, fullName, parseLocalDate } from "@/lib/utils";
import { ProfileSection } from "@/components/ProfileSection";
import { EditProfileButton } from "@/components/ProfileEditForm";
import { PreviousClubsManager } from "@/components/PreviousClubsManager";
import { HighlightsManager } from "@/components/HighlightsManager";
import { Avatar } from "@/components/Avatar";
import { AvatarEditor } from "@/components/AvatarEditor";
import { ContactButton } from "@/components/ContactButton";

export function PlayerProfileView({
  player,
  isOwner,
  viewerRole = null,
}: {
  player: PlayerWithRelations;
  isOwner: boolean;
  viewerRole?: UserRole | null;
}) {
  const age = calculateAge(player.birth_date);

  return (
    <div className="flex flex-col gap-6">
      {/* Encabezado de scouting: la info deportiva tiene más protagonismo */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {isOwner ? <AvatarEditor player={player} /> : <Avatar player={player} size="lg" />}
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {fullName(player)}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-muted">
              <span>{age} años</span>
              {player.position && (
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-strong">
                  {POSITION_LABELS[player.position]}
                </span>
              )}
              {player.current_club && <span>· {player.current_club}</span>}
            </div>
          </div>
        </div>
        {isOwner && <EditProfileButton player={player} />}
        {!isOwner && viewerRole === "club" && <ContactButton playerId={player.id} />}
      </div>

      {/* Datos deportivos primero: son el foco de un perfil de scouting */}
      <ProfileSection title="Datos deportivos">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">Posición</dt>
            <dd className="font-medium">
              {player.position ? POSITION_LABELS[player.position] : "Sin datos"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Club actual</dt>
            <dd className="font-medium">{player.current_club || "Sin datos"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Estatura</dt>
            <dd className="font-medium">{formatHeight(player.height_cm)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Peso</dt>
            <dd className="font-medium">{formatWeight(player.weight_kg)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Nacionalidad</dt>
            <dd className="font-medium">{player.nationality || "Sin datos"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Calificación TalenTree</dt>
            <dd className="font-medium">
              {player.rating !== null ? `★ ${player.rating.toFixed(1)} / 10` : "Sin calificar"}
            </dd>
          </div>
        </dl>
      </ProfileSection>

      <ProfileSection title="Clubes anteriores">
        <PreviousClubsManager
          playerId={player.id}
          clubs={player.previous_clubs}
          editable={isOwner}
        />
      </ProfileSection>

      <ProfileSection title={isOwner ? "Mis highlights" : "Highlights"}>
        <HighlightsManager
          playerId={player.id}
          videos={player.highlight_videos}
          editable={isOwner}
        />
      </ProfileSection>

      <ProfileSection title="Datos personales">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">Nombre</dt>
            <dd className="font-medium">{player.first_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Apellido</dt>
            <dd className="font-medium">{player.last_name}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Fecha de nacimiento</dt>
            <dd className="font-medium">
              {parseLocalDate(player.birth_date)?.toLocaleDateString("es-AR")}
            </dd>
          </div>
        </dl>
      </ProfileSection>
    </div>
  );
}
