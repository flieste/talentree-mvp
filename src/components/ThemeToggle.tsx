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
        role="switch"
        aria-checked={isDark}
        aria-label="Cambiar tema"
        disabled={!mounted}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn(
          "relative h-7 w-13 shrink-0 rounded-full border border-border transition-colors",
          isDark ? "bg-accent" : "bg-bg-subtle",
        )}
        style={{ width: "3.25rem" }}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow transition-transform",
            isDark ? "translate-x-6" : "translate-x-0.5",
          )}
          style={{ height: "1.375rem", width: "1.375rem" }}
        />
      </button>
    </div>
  );
}
