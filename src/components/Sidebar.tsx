"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

const PLAYER_NAV = [
  { href: "/", label: "Inicio" },
  { href: "/news", label: "Noticias y eventos" },
  { href: "/profile", label: "Perfil" },
  { href: "/settings", label: "Configuración" },
  { href: "/chat", label: "Chat" },
  { href: "/help", label: "Ayuda" },
] as const;

/** El club no tiene "perfil de jugador": su Perfil reúne avisos y responsables. */
const CLUB_NAV = [
  { href: "/", label: "Inicio" },
  { href: "/players", label: "Buscar jugadores" },
  { href: "/news", label: "Noticias y eventos" },
  { href: "/profile", label: "Perfil" },
  { href: "/chat", label: "Chat" },
  { href: "/settings", label: "Configuración" },
  { href: "/help", label: "Ayuda" },
] as const;

export function Sidebar({ onNavigate, role }: { onNavigate?: () => void; role: UserRole }) {
  const pathname = usePathname();
  const items = role === "club" ? CLUB_NAV : PLAYER_NAV;

  return (
    <nav className="flex h-full flex-col justify-between p-4">
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent/10 text-accent-strong"
                    : "text-text hover:bg-bg-subtle",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-muted transition-colors hover:bg-bg-subtle hover:text-text"
        >
          Cerrar sesión
        </button>
      </form>
    </nav>
  );
}
