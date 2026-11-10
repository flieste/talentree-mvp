import { redirect } from "next/navigation";
import { getCurrentUser, getPlayerWithRelations, getCurrentPlayer } from "@/lib/data/players";
import { getRole } from "@/lib/data/auth";
import { getClubAnnouncements, getClubManagers, getCurrentClub } from "@/lib/data/clubs";
import { PlayerProfileView } from "@/components/PlayerProfileView";
import { ClubProfileView } from "@/components/ClubProfileView";

export default async function MyProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = await getRole();

  if (role === "club") {
    const club = await getCurrentClub();
    if (!club) {
      return (
        <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">
          Todavía no pudimos encontrar el perfil de tu club. Contactá a soporte.
        </div>
      );
    }
    const [managers, announcements] = await Promise.all([
      getClubManagers(club.id),
      getClubAnnouncements(club.id),
    ]);
    return <ClubProfileView club={club} managers={managers} announcements={announcements} />;
  }

  const player = await getCurrentPlayer();
  if (!player) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-text-muted">
        Todavía no pudimos crear tu perfil de jugador. Probá cerrar sesión y volver a
        entrar; si el problema sigue, contactá a soporte.
      </div>
    );
  }

  const fullPlayer = await getPlayerWithRelations(player.id);
  if (!fullPlayer) return null;

  return <PlayerProfileView player={fullPlayer} isOwner />;
}
