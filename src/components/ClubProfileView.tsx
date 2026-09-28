import type { Club, ClubAnnouncement, ClubManager } from "@/lib/types";
import { ProfileSection } from "@/components/ProfileSection";
import { EditClubButton } from "@/components/ClubEditForm";
import { ClubLogoEditor } from "@/components/ClubLogoEditor";
import { ManagersManager } from "@/components/ManagersManager";
import { AnnouncementsManager } from "@/components/AnnouncementsManager";

/**
 * "Perfil" del club: en lugar de un perfil deportivo, reúne los datos del club,
 * los responsables de la cuenta y los avisos que el club le manda a TalenTree.
 */
export function ClubProfileView({
  club,
  managers,
  announcements,
}: {
  club: Club;
  managers: ClubManager[];
  announcements: ClubAnnouncement[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ClubLogoEditor club={club} />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {club.club_name || "Tu club"}
            </h1>
            <p className="text-sm text-text-muted">{club.city || "Sin ciudad cargada"}</p>
          </div>
        </div>
        <EditClubButton club={club} />
      </div>

      {club.description && (
        <ProfileSection title="Sobre el club">
          <p className="text-text-muted">{club.description}</p>
        </ProfileSection>
      )}

      <ProfileSection title="Avisos para TalenTree">
        <AnnouncementsManager announcements={announcements} />
      </ProfileSection>

      <ProfileSection title="Responsables de la cuenta">
        <ManagersManager managers={managers} />
      </ProfileSection>
    </div>
  );
}
