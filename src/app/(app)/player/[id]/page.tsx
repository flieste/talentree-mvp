import { notFound } from "next/navigation";
import { getCurrentUser, getPlayerWithRelations } from "@/lib/data/players";
import { getRole } from "@/lib/data/auth";
import { PlayerProfileView } from "@/components/PlayerProfileView";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const player = await getPlayerWithRelations(id);
  if (!player) notFound();

  const [user, role] = await Promise.all([getCurrentUser(), getRole()]);
  const isOwner = Boolean(user && player.user_id === user.id);

  return <PlayerProfileView player={player} isOwner={isOwner} viewerRole={role} />;
}
