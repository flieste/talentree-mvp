"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestClubAccount, type ClubRequestState } from "@/app/solicitar-club/actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: ClubRequestState = { status: "idle" };

export function ClubRequestForm() {
  const [state, formAction, isPending] = useActionState(requestClubAccount, initialState);
  const v = state.values ?? {};

  if (state.status === "ok") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-3 text-sm text-accent-strong">
          ¡Recibimos tu solicitud! Revisamos los datos y, si está todo bien, te escribimos al email
          que dejaste para entregarte el acceso de tu club.
        </p>
        <Link href="/login" className="text-sm font-medium text-accent hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input label="Nombre del club" name="clubName" defaultValue={v.clubName} required />
      <Input label="Ciudad" name="city" defaultValue={v.city} placeholder="Ej: Luján" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Tu nombre" name="contactName" defaultValue={v.contactName} required />
        <Input label="Cargo" name="roleTitle" defaultValue={v.roleTitle} placeholder="Ej: Coordinador" />
      </div>
      <Input label="Email" name="email" type="email" defaultValue={v.email} placeholder="club@email.com" required />
      <Input label="Teléfono o WhatsApp" name="phone" defaultValue={v.phone} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="club-request-message" className="text-sm font-medium text-text">
          Mensaje (opcional)
        </label>
        <textarea
          id="club-request-message"
          name="message"
          rows={3}
          maxLength={1000}
          defaultValue={v.message}
          placeholder="Categorías, cantidad de jugadores, qué esperan de TalenTree..."
          className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[0.95rem] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent"
        />
      </div>
      {/* Campo trampa para bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <label className="flex items-start gap-2 text-sm text-text-muted">
        <input type="checkbox" name="consent" className="mt-1" />
        Acepto que TalenTree me contacte por esta solicitud.
      </label>
      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <Button type="submit" isLoading={isPending} className="w-full">
        Enviar solicitud
      </Button>
    </form>
  );
}
