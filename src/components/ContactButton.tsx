"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { startConversation } from "@/app/(app)/chat/actions";

/** Botón que ve el club en el perfil de un jugador: abre (o retoma) el chat con él. */
export function ContactButton({ playerId }: { playerId: string }) {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(undefined);
    startTransition(async () => {
      // Si sale bien, la acción redirige al chat y no vuelve acá.
      const result = await startConversation(playerId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <Button onClick={handleClick} disabled={isPending}>
        {isPending ? "Abriendo chat..." : "Contactar"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
