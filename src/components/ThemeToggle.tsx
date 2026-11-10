"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita mismatches de hidratación: el tema real solo se conoce en el cliente.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- patrón estándar de next-themes
  useEffect(() => setMounted(true), []);

  const isDark = mounted && theme === "dark";

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
      <div>
        <p className="font-medium text-text">Tema</p>
        <p className="text-sm text-text-muted">
          {mounted ? (isDark ? "Modo oscuro" : "Modo claro") : "Cargando..."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label="Cambiar tema"
        disabled={!mounted}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "relative shrink-0 rounded-full border border-border p-0 transition-colors",
          isDark ? "bg-accent" : "bg-bg-subtle",
        )}
        style={{ width: 52, height: 28 }}
      >
        {/* Medidas fijas en px: la bolita (22px) queda a 2px del borde en ambos extremos. */}
        <span
          aria-hidden="true"
          className="absolute rounded-full bg-white shadow transition-transform"
          style={{
            top: 2,
            left: 2,
            width: 22,
            height: 22,
            transform: isDark ? "translateX(24px)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}
