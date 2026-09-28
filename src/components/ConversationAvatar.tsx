import { cn } from "@/lib/utils";

/** Avatar de la otra persona en el chat: su foto o las iniciales del nombre. */
export function ConversationAvatar({
  name,
  avatarUrl,
  className,
  isClub = false,
}: {
  name: string;
  avatarUrl: string | null;
  className?: string;
  /** Los escudos de club se muestran enteros y cuadrados, no como foto circular recortada. */
  isClub?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden font-display text-base font-semibold text-accent-strong",
        isClub ? "rounded-lg" : "rounded-full",
        isClub && avatarUrl ? "bg-white p-0.5" : "bg-accent/15",
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- foto de perfil ya liviana desde Storage
        <img
          src={avatarUrl}
          alt=""
          className={cn("h-full w-full", isClub ? "object-contain" : "object-cover")}
        />
      ) : (
        initials
      )}
    </div>
  );
}
