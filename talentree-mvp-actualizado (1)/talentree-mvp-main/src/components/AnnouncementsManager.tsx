"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { addAnnouncement, deleteAnnouncement } from "@/app/(app)/profile/club-actions";
import {
  ANNOUNCEMENT_STATUS_LABELS,
  NEWS_CATEGORY_LABELS,
  type AnnouncementStatus,
  type ClubAnnouncement,
} from "@/lib/types";
import { cn, parseLocalDate } from "@/lib/utils";

const CATEGORY_OPTIONS = Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const STATUS_STYLES: Record<AnnouncementStatus, string> = {
  pendiente: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  publicado: "bg-accent/15 text-accent-strong",
  rechazado: "bg-danger/10 text-danger",
};

export function AnnouncementsManager({ announcements }: { announcements: ClubAnnouncement[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result = await addAnnouncement(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAnnouncement(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Avisanos si querés hacer una prueba u otro evento. Lo revisamos y, si está todo bien, lo
        publicamos en Noticias y eventos para que lo vean los jugadores.
      </p>

      {announcements.length === 0 ? (
        <EmptyState title="Todavía no enviaste avisos." />
      ) : (
        <ul className="flex flex-col gap-2">
          {announcements.map((a) => {
            const date = parseLocalDate(a.proposed_date)?.toLocaleDateString("es-AR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            return (
              <li key={a.id} className="rounded-lg border border-border px-3.5 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-text">{a.title}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_STYLES[a.status],
                        )}
                      >
                        {ANNOUNCEMENT_STATUS_LABELS[a.status]}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted">
                      {[NEWS_CATEGORY_LABELS[a.category], date, a.location]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {a.description && <p className="mt-1 text-sm text-text-muted">{a.description}</p>}
                    {a.team_note && (
                      <p className="mt-1 text-sm text-text">
                        <span className="font-medium">Nota de TalenTree:</span> {a.team_note}
                      </p>
                    )}
                  </div>
                  {a.status === "pendiente" && (
                    <button
                      onClick={() => handleDelete(a.id)}
                      aria-label={`Retirar aviso ${a.title}`}
                      className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-bg-subtle hover:text-danger"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button variant="secondary" size="sm" className="self-start" onClick={() => setOpen(true)}>
        + Nuevo aviso
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo aviso para TalenTree">
        <form action={handleAdd} className="flex flex-col gap-4">
          <Input label="Título" name="title" placeholder="Prueba abierta categorías 2007 y 2008" required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" name="category" options={CATEGORY_OPTIONS} defaultValue="prueba_club" />
            <Input label="Fecha" name="proposedDate" type="date" />
          </div>
          <Input label="Lugar" name="location" placeholder="Dirección o predio" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="announcement-description" className="text-sm font-medium text-text">
              Detalles
            </label>
            <textarea
              id="announcement-description"
              name="description"
              rows={3}
              placeholder="Horario, categorías, qué tienen que llevar los jugadores..."
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[0.95rem] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              Enviar aviso
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
