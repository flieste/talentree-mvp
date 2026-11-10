"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createNews, deleteNews, updateNews } from "@/app/(app)/admin/actions";
import { NEWS_CATEGORY_LABELS, type NewsItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { parseLocalDate } from "@/lib/utils";

const CATEGORY_OPTIONS = Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => ({ value, label }));

export function AdminNewsManager({ news }: { news: NewsItem[] }) {
  // null = cerrado, "new" = crear, NewsItem = editar
  const [editing, setEditing] = useState<NewsItem | "new" | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const close = () => {
    setEditing(null);
    setError(undefined);
  };

  function handleSubmit(formData: FormData) {
    setError(undefined);
    startTransition(async () => {
      const result =
        editing && editing !== "new" ? await updateNews(editing.id, formData) : await createNews(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function handleDelete(item: NewsItem) {
    if (!confirm(`¿Eliminar "${item.title}"? Deja de verse para todos.`)) return;
    startTransition(async () => {
      await deleteNews(item.id);
      router.refresh();
    });
  }

  const item = editing && editing !== "new" ? editing : null;

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" onClick={() => setEditing("new")}>
        + Nueva noticia o evento
      </Button>

      {news.length === 0 ? (
        <EmptyState title="Todavía no hay noticias cargadas." description="Lo que cargues acá aparece en el Inicio y en Noticias y eventos de todos." />
      ) : (
        <ul className="flex flex-col gap-2">
          {news.map((n) => {
            const date = parseLocalDate(n.event_date);
            return (
              <li key={n.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4">
                <div className="min-w-0">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-sm text-text-muted">
                    {[NEWS_CATEGORY_LABELS[n.category], n.location, date?.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(n)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" disabled={isPending} onClick={() => handleDelete(n)}>
                    Eliminar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={editing !== null} onClose={close} title={item ? "Editar noticia" : "Nueva noticia o evento"}>
        <form action={handleSubmit} key={item?.id ?? "new"} className="flex flex-col gap-4">
          <Input label="Título" name="title" defaultValue={item?.title ?? ""} maxLength={150} required />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo" name="category" options={CATEGORY_OPTIONS} defaultValue={item?.category ?? "noticia"} />
            <Input label="Fecha" name="eventDate" type="date" defaultValue={item?.event_date ?? ""} />
          </div>
          <Input label="Lugar" name="location" defaultValue={item?.location ?? ""} placeholder="Dirección o predio" />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="news-description" className="text-sm font-medium text-text">
              Descripción
            </label>
            <textarea
              id="news-description"
              name="description"
              rows={3}
              maxLength={1000}
              defaultValue={item?.description ?? ""}
              className="rounded-lg border border-border bg-surface px-3.5 py-2.5 text-[0.95rem] text-text focus-visible:outline-2 focus-visible:outline-accent"
            />
          </div>
          <Input label="Link (opcional)" name="linkUrl" type="url" defaultValue={item?.link_url ?? ""} placeholder="https://..." />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              {item ? "Guardar" : "Publicar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
