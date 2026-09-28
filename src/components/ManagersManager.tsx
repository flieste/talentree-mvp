"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { addManager, deleteManager } from "@/app/(app)/profile/club-actions";
import type { ClubManager } from "@/lib/types";

export function ManagersManager({ managers }: { managers: ClubManager[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleAdd(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result = await addManager(formData);
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
      await deleteManager(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-text-muted">
        Las personas del club que se encargan de manejar la cuenta. Podés cargar más de una,
        cada una con su email.
      </p>

      {managers.length === 0 ? (
        <EmptyState title="Todavía no cargaste responsables." />
      ) : (
        <ul className="flex flex-col gap-2">
          {managers.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-text">
                  {m.full_name}
                  {m.role_title && (
                    <span className="font-normal text-text-muted"> · {m.role_title}</span>
                  )}
                </p>
                <a
                  href={`mailto:${m.email}`}
                  className="truncate text-sm text-accent-strong hover:underline"
                >
                  {m.email}
                </a>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                aria-label={`Eliminar a ${m.full_name}`}
                className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-bg-subtle hover:text-danger"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button variant="secondary" size="sm" className="self-start" onClick={() => setOpen(true)}>
        + Agregar responsable
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Agregar responsable">
        <form action={handleAdd} className="flex flex-col gap-4">
          <Input label="Nombre y apellido" name="fullName" autoComplete="off" required />
          <Input label="Cargo" name="roleTitle" placeholder="Ej: Coordinador de captación" />
          <Input label="Email" name="email" type="email" placeholder="nombre@club.com" required />
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
    </div>
  );
}
