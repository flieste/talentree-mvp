import type { Club } from "@/lib/types";
import { cn } from "@/lib/utils";

const sizes = {
  md: "h-12 w-12 text-lg",
  lg: "h-16 w-16 text-2xl",
  xl: "h-28 w-28 text-4xl",
} as const;

/**
 * Escudo del club. Se muestra entero (object-contain), sin recortar, sobre un
 * fondo claro para que los escudos con transparencia se vean bien en modo oscuro.
 * Sin escudo cargado, muestra la inicial del club.
 */
export function ClubLogo({
  club,
  size = "lg",
  className,
}: {
  club: Pick<Club, "club_name" | "logo_url">;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-display font-semibold",
        club.logo_url ? "bg-white p-1" : "bg-accent/15 text-accent-strong",
        sizes[size],
        className,
      )}
    >
      {club.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- escudo ya liviano desde Supabase Storage
        <img
          src={club.logo_url}
          alt={`Escudo de ${club.club_name}`}
          className="h-full w-full object-contain"
        />
      ) : (
        (club.club_name[0] ?? "C").toUpperCase()
      )}
    </div>
  );
}
