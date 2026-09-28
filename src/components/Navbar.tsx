"use client";

import Link from "next/link";
import { LogoMark } from "@/components/LogoMark";

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3 backdrop-blur">
      <button
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="rounded-lg p-2 text-text hover:bg-bg-subtle lg:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <Link href="/" aria-label="TalenTree — Inicio" className="flex items-center">
        <LogoMark size={32} />
      </Link>
    </header>
  );
}
