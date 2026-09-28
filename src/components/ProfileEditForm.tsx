"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { updatePlayerProfile } from "@/app/(app)/profile/actions";
import { POSITION_OPTIONS, type Player } from "@/lib/types";

export function EditProfileButton({ player }: { player: Player }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(undefined);

    // El campo del formulario pide la estatura en metros (igual que se
    // muestra en el resto de la app, ej. "1.76 m"), pero la base de datos
    // y el server action guardan height_cm en centímetros. Convertimos acá
    // antes de enviar para no mezclar unidades entre pantalla y guardado.
    const heightMetersRaw = String(formData.get("height") ?? "").trim();
    if (heightMetersRaw) {
      const heightMeters = Number(heightMetersRaw);
      if (!Number.isFinite(heightMeters) || heightMeters <= 0) {
        setError("La estatura debe ser un número positivo (en metros).");
        return;
      }
      formData.set("height", String(Math.round(heightMeters * 100)));
    }

    startTransition(async () => {
      const result = await updatePlayerProfile(player.id, formData);
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
        Editar perfil
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Editar perfil">
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre"
              name="firstName"
              defaultValue={player.first_name}
              required
            />
            <Input
              label="Apellido"
              name="lastName"
              defaultValue={player.last_name}
              required
            />
          </div>
          <Input
            label="Fecha de nacimiento"
            name="birthDate"
            type="date"
            defaultValue={player.birth_date}
            required
          />
          <Select
            label="Posición"
            name="position"
            options={POSITION_OPTIONS}
            placeholder="Seleccioná una posición"
            defaultValue={player.position ?? ""}
          />
          <Input
            label="Nacionalidad"
            name="nationality"
            defaultValue={player.nationality ?? ""}
            placeholder="Ej: Argentina"
          />
          <Input
            label="Club actual"
            name="currentClub"
            defaultValue={player.current_club ?? ""}
            placeholder="Ej: Club Atlético Luján"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estatura (m)"
              name="height"
              type="number"
              min={1}
              max={2.5}
              step="0.01"
              placeholder="1.76"
              defaultValue={player.height_cm ? (player.height_cm / 100).toFixed(2) : ""}
            />
            <Input
              label="Peso (kg)"
              name="weight"
              type="number"
              min={1}
              step="0.1"
              defaultValue={player.weight_kg ?? ""}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="mt-1 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
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
