"use client";

import Form from "next/form";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { POSITION_OPTIONS } from "@/lib/types";

export interface PlayerSearchValues {
  q: string;
  position: string;
  ageMin: string;
  ageMax: string;
  rating: string;
  nationality: string;
  club: string;
}

const RATING_OPTIONS = [
  { value: "", label: "Cualquiera" },
  { value: "6", label: "6.0 o más" },
  { value: "7", label: "7.0 o más" },
  { value: "8", label: "8.0 o más" },
  { value: "9", label: "9.0 o más" },
];

/**
 * Barra de búsqueda por nombre + filtros. Es un formulario GET: los filtros
 * quedan en la URL (se pueden compartir/guardar) y la búsqueda corre en el servidor.
 */
export function PlayerSearchForm({
  values,
  nationalities,
  hasFilters,
}: {
  values: PlayerSearchValues;
  nationalities: string[];
  hasFilters: boolean;
}) {
  return (
    <Form action="/players" className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={values.q}
            placeholder="Buscar jugador por nombre"
            aria-label="Buscar jugador por nombre"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3.5 text-[0.95rem] text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-accent px-5 py-2.5 text-[0.95rem] font-medium text-accent-contrast transition-colors hover:bg-accent-strong"
        >
          Buscar
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 md:grid-cols-3">
        <Select
          label="Posición"
          name="position"
          defaultValue={values.position}
          options={[{ value: "", label: "Todas" }, ...POSITION_OPTIONS]}
        />
        <Input label="Edad desde" name="ageMin" type="number" min={5} max={60} defaultValue={values.ageMin} />
        <Input label="Edad hasta" name="ageMax" type="number" min={5} max={60} defaultValue={values.ageMax} />
        <Select label="Calificación" name="rating" defaultValue={values.rating} options={RATING_OPTIONS} />
        <Select
          label="Nacionalidad"
          name="nationality"
          defaultValue={values.nationality}
          options={[{ value: "", label: "Todas" }, ...nationalities.map((n) => ({ value: n, label: n }))]}
        />
        <Input label="Club" name="club" defaultValue={values.club} placeholder="Club actual" />
      </div>

      {hasFilters && (
        <Link href="/players" className="self-start text-sm font-medium text-accent-strong hover:underline">
          Limpiar búsqueda
        </Link>
      )}
    </Form>
  );
}
