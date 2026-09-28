"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { addPreviousClub, deletePreviousClub } from "@/app/(app)/profile/actions";
import type { PreviousClub } from "@/lib/types";
import { parseLocalDate } from "@/lib/utils";

function formatRange(club: PreviousClub) {
  const start = parseLocalDate(club.start_date)?.getFullYear() ?? null;
  const end = parseLocalDate(club.end_date)?.getFullYear() ?? null;
  if (!start && !end) return null;
  return `${start ?? "?"} — ${end ?? "actualidad"}`;
}

export function PreviousClubsManager({
  playerId,
  clubs,
  editable,
}: {
  playerId: string;
  clubs: PreviousClub[];
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result = await addPreviousClub(playerId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  function handleDelete(clubRowId: string) {
    startTransition(async () => {
      await deletePreviousClub(clubRowId, playerId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {clubs.length === 0 ? (
        <EmptyState title="No agregaste clubes anteriores." />
      ) : (
        <ul className="flex flex-col gap-2">
          {clubs.map((club) => (
            <li
              key={club.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{club.club_name}</p>
                {formatRange(club) && (
                  <p className="text-xs text-text-muted">{formatRange(club)}</p>
                )}
              </div>
              {editable && (
                <button
                  onClick={() => handleDelete(club.id)}
                  aria-label={`Eliminar ${club.club_name}`}
                  className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-bg-subtle hover:text-danger"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editable && (
        <>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setOpen(true)}
          >
            + Agregar club anterior
          </Button>
          <Modal open={open} onClose={() => setOpen(false)} title="Agregar club anterior">
            <form action={handleAdd} className="flex flex-col gap-4">
              <Input label="Nombre del club" name="clubName" required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Desde" name="startDate" type="date" />
                <Input label="Hasta" name="endDate" type="date" />
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
                  Agregar
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
