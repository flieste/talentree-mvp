"use client";

import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "@/app/actualizar-clave/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: UpdatePasswordState = {};

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(updatePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres."
        required
      />
      <Input
        label="Repetí la contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
      />
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" isLoading={isPending} className="mt-1 w-full">
        Guardar y entrar
      </Button>
    </form>
  );
}
