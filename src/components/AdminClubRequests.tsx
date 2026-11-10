"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveClubRequest,
  regenerateAccessLink,
  rejectClubRequest,
  type AdminResult,
} from "@/app/(app)/admin/actions";
import type { ClubRequest, RequestStatus } from "@/lib/data/admin";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { CopyButton } from "@/components/CopyButton";
import { cn } from "@/lib/utils";

const FILTERS: { value: RequestStatus; label: string }[] = [
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobada", label: "Aprobadas" },
  { value: "rechazada", label: "Rechazadas" },
];

const STATUS_STYLE: Record<RequestStatus, string> = {
  pendiente: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-300",
  aprobada: "bg-green-100 text-green-900 dark:bg-green-400/15 dark:text-green-300",
  rechazada: "bg-red-100 text-red-900 dark:bg-red-400/15 dark:text-red-300",
};

export function AdminClubRequests({ requests }: { requests: ClubRequest[] }) {
  const [filter, setFilter] = useState<RequestStatus>("pendiente");
  const [links, setLinks] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const visible = requests.filter((r) => r.status === filter);
  const counts = (s: RequestStatus) => requests.filter((r) => r.status === s).length;

  function run(id: string, action: () => Promise<AdminResult>) {
    setBusy(id);
    setErrors((e) => ({ ...e, [id]: "" }));
    startTransition(async () => {
      const result = await action();
      if (result.accessLink) {
        setLinks((l) => ({ ...l, [id]: result.accessLink! }));
        // La solicitud sale de "Pendientes": mostramos "Aprobadas" para que se vea el link.
        setFilter("aprobada");
      }
      if (result.error) setErrors((e) => ({ ...e, [id]: result.error! }));
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors",
              filter === f.value ? "bg-accent/10 text-accent-strong" : "text-text-muted hover:bg-bg-subtle",
            )}
          >
            {f.label} ({counts(f.value)})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No hay solicitudes en este estado." />
      ) : (
        <ul className="flex flex-col gap-3">
          {visible.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-semibold">{r.club_name}</h3>
                  <p className="text-sm text-text-muted">
                    {r.city || "Sin ciudad"} · enviada el{" "}
                    {new Date(r.created_at).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>
                  {FILTERS.find((f) => f.value === r.status)?.label.slice(0, -1) ?? r.status}
                </span>
              </div>

              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-text-muted">Contacto</dt>
                  <dd className="font-medium">
                    {r.contact_name}
                    {r.role_title ? ` · ${r.role_title}` : ""}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-xs text-text-muted">Email</dt>
                  <dd className="break-words font-medium">{r.email}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-muted">Teléfono</dt>
                  <dd className="font-medium">{r.phone || "—"}</dd>
                </div>
              </dl>

              {r.message && (
                <p className="whitespace-pre-wrap rounded-lg bg-bg-subtle px-3.5 py-2.5 text-sm text-text-muted">
                  {r.message}
                </p>
              )}

              {links[r.id] && (
                <div className="flex flex-col gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3.5">
                  <p className="text-sm font-medium text-accent-strong">
                    Cuenta lista. Enviale este link al club (sirve una sola vez y vence en poco tiempo):
                  </p>
                  <code className="break-all rounded bg-surface px-2 py-1.5 text-xs">{links[r.id]}</code>
                  <div>
                    <CopyButton value={links[r.id]} label="Copiar link" />
                  </div>
                </div>
              )}

              {errors[r.id] && (
                <p role="alert" className="text-sm text-danger">
                  {errors[r.id]}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {r.status === "pendiente" && (
                  <>
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => run(r.id, () => approveClubRequest(r.id))}
                    >
                      {busy === r.id ? "Creando cuenta..." : "Aprobar y crear cuenta"}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isPending}
                      onClick={() => {
                        if (confirm(`¿Rechazar la solicitud de ${r.club_name}?`)) run(r.id, () => rejectClubRequest(r.id));
                      }}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
                {r.status === "aprobada" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => run(r.id, () => regenerateAccessLink(r.id))}
                  >
                    Generar link de acceso
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
