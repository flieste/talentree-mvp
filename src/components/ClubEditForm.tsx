"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateClub } from "@/app/(app)/profile/club-actions";
import type { Club } from "@/lib/types";

export function EditClubButton({ club }: { club: Club }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result = await updateClub(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Editar datos del club
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Datos del club">
        <form action={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nombre del club" name="clubName" defaultValue={club.club_name} required />
          <Input label="Ciudad" name="city" defaultValue={club.city ?? ""} placeholder="Ej: José C. Paz" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="club-description" className="text-sm font-medium text-text">
              Descripción
            </label>
            <textarea
              id="club-description"
              name="description"
              rows={4}
              defaultValue={club.description ?? ""}
              placeholder="Categorías, instalaciones, historia..."
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
              Guardar cambios
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
