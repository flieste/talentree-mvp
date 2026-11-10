"use client";

import { useState, type ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import type { UserRole } from "@/lib/types";

export function AppShell({ children, role }: { children: ReactNode; role: UserRole }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar onMenuClick={() => setMobileOpen(true)} />

      <div className="mx-auto flex max-w-6xl">
        {/* Sidebar de escritorio */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 shrink-0 border-r border-border lg:block">
          <Sidebar role={role} />
        </aside>

        {/* Drawer mobile */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 border-r border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="text-sm font-medium text-text-muted">Menú</span>
                <button
                  aria-label="Cerrar menú"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md p-1.5 text-text-muted hover:bg-bg-subtle hover:text-text"
                >
                  ✕
                </button>
              </div>
              <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
