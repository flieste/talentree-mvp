"use client";

import { useActionState } from "react";
import { register, type RegisterState } from "@/app/register/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre" name="firstName" autoComplete="given-name" required />
        <Input label="Apellido" name="lastName" autoComplete="family-name" required />
      </div>
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="tu@email.com"
        required
      />
      <Input
        label="Fecha de nacimiento"
        name="birthDate"
        type="date"
        autoComplete="bday"
        required
      />
      <Input
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres."
        required
      />
      <Input
        label="Confirmar contraseña"
        name="confirmPassword"
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
        Crear cuenta
      </Button>
    </form>
  );
}
