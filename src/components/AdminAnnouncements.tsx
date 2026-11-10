"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publishAnnouncement,
  rejectAnnouncement,
  reopenAnnouncement,
  type AdminResult,
} from "@/app/(app)/admin/actions";
import type { AdminAnnouncement } from "@/lib/data/admin";
import {
  ANNOUNCEMENT_STATUS_LABELS,
  NEWS_CATEGORY_LABELS,
  type AnnouncementStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, parseLocalDate } from "@/lib/utils";

const FILTERS: AnnouncementStatus[] = ["pendiente", "publicado", "rechazado"];
const FILTER_LABEL: Record<AnnouncementStatus, string> = {
  pendiente: "En revisión",
  publicado: "Publicados",
  rechazado: "No publicados",
};
const STATUS_STYLE: Record<AnnouncementStatus, string> = {
  pendiente: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300",
  publicado: "bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300",
  rechazado: "bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-300",
};

export function AdminAnnouncements({ announcements }: { announcements: AdminAnnouncement[] }) {
  const [filter, setFilter] = useState<AnnouncementStatus>("pendiente");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const visible = announcements.filter((a) => a.status === filter);

  function run(id: string, action: () => Promise<AdminResult>) {
    setErrors((e) => ({ ...e, [id]: "" }));
    startTransition(async () => {
      const result = await action();
      if (result.error) setErrors((e) => ({ ...e, [id]: result.error! }));
      else {
        setRejecting(null);
        setNote("");
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f ? "bg-accent/10 text-accent-strong" : "text-text-muted hover:bg-bg-subtle",
            )}
          >
            {FILTER_LABEL[f]} ({announcements.filter((a) => a.status === f).length})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No hay avisos en este estado." />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((a) => {
            const date = parseLocalDate(a.proposed_date);
            return (
              <li key={a.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl font-semibold">{a.title}</h3>
                    <p className="text-sm text-text-muted">
                      {a.club?.club_name ?? "Club"}
                      {a.club?.city ? ` · ${a.club.city}` : ""} · {NEWS_CATEGORY_LABELS[a.category]}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[a.status])}>
                    {ANNOUNCEMENT_STATUS_LABELS[a.status]}
                  </span>
                </div>

                <p className="text-sm text-text-muted">
                  {[a.location, date?.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })]
                    .filter(Boolean)
                    .join(" · ") || "Sin lugar ni fecha"}
                </p>
                {a.description && (
                  <p className="whitespace-pre-wrap rounded-lg bg-bg-subtle px-3.5 py-2.5 text-sm">{a.description}</p>
                )}
                {a.contacts.length > 0 && (
                  <p className="text-xs text-text-muted">
                    Contacto:{" "}
                    {a.contacts.map((c) => `${c.full_name}${c.role_title ? ` (${c.role_title})` : ""} — ${c.email}`).join(" · ")}
                  </p>
                )}
                {a.status === "rechazado" && a.team_note && (
                  <p className="text-sm">
                    <span className="font-medium">Nota enviada al club:</span> {a.team_note}
                  </p>
                )}

                {rejecting === a.id && (
                  <div className="flex flex-col gap-2">
                    <label htmlFor={`note-${a.id}`} className="text-sm font-medium">
                      Motivo (lo ve el club)
                    </label>
                    <textarea
                      id={`note-${a.id}`}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="Ej: Ya tenemos cubierta esa fecha. Probá con enero."
                      className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[0.95rem] focus-visible:outline-2 focus-visible:outline-accent"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="danger" disabled={isPending} onClick={() => run(a.id, () => rejectAnnouncement(a.id, note))}>
                        Confirmar rechazo
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRejecting(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {errors[a.id] && (
                  <p role="alert" className="text-sm text-danger">
                    {errors[a.id]}
                  </p>
                )}

                {rejecting !== a.id && (
                  <div className="flex flex-wrap gap-2">
                    {a.status !== "publicado" && (
                      <Button size="sm" disabled={isPending} onClick={() => run(a.id, () => publishAnnouncement(a.id))}>
                        Publicar en noticias
                      </Button>
                    )}
                    {a.status === "pendiente" && (
                      <Button size="sm" variant="danger" disabled={isPending} onClick={() => { setRejecting(a.id); setNote(""); }}>
                        No publicar
                      </Button>
                    )}
                    {a.status === "rechazado" && (
                      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => run(a.id, () => reopenAnnouncement(a.id))}>
                        Volver a revisión
                      </Button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
