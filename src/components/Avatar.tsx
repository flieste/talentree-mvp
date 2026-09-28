import type { Player } from "@/lib/types";
import { cn } from "@/lib/utils";

type AvatarPlayer = Pick<Player, "first_name" | "last_name" | "avatar_url">;

const sizes = {
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-2xl",
  xl: "h-28 w-28 text-4xl",
} as const;

export function initials(p: Pick<Player, "first_name" | "last_name">) {
  return `${p.first_name[0] ?? ""}${p.last_name[0] ?? ""}`.toUpperCase();
}

/** Foto de perfil del jugador; si no cargó una, muestra sus iniciales. */
export function Avatar({
  player,
  size = "md",
  className,
}: {
  player: AvatarPlayer;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent/15 font-display font-semibold text-accent-strong",
        sizes[size],
        className,
      )}
    >
      {player.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto ya recortada y liviana desde Supabase Storage
        <img
          src={player.avatar_url}
          alt={`Foto de ${player.first_name} ${player.last_name}`.trim()}
          className="h-full w-full object-cover"
        />
      ) : (
        initials(player)
      )}
    </div>
  );
}
