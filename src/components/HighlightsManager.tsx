"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { VideoCard } from "@/components/VideoCard";
import {
  addHighlightVideo,
  addHighlightVideoFile,
  deleteHighlightVideo,
} from "@/app/(app)/profile/actions";
import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_VIDEO_MIME, MAX_VIDEO_FILE_MB, VIDEO_BUCKET } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { HighlightVideo } from "@/lib/types";

type Mode = "url" | "file";

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function HighlightsManager({
  playerId,
  videos,
  editable,
}: {
  playerId: string;
  videos: HighlightVideo[];
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("url");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function resetForm() {
    setMode("url");
    setFile(null);
    setError(undefined);
  }

  function closeModal() {
    setOpen(false);
    resetForm();
  }

  function handleFileChange(selected: File | null) {
    setError(undefined);
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED_VIDEO_MIME.includes(selected.type)) {
      setFile(null);
      setError("El archivo tiene que ser un video MP4, MOV o WebM.");
      return;
    }
    if (selected.size > MAX_VIDEO_FILE_MB * 1024 * 1024) {
      setFile(null);
      setError(`El video pesa ${formatSize(selected.size)}. El máximo es ${MAX_VIDEO_FILE_MB} MB.`);
      return;
    }
    setFile(selected);
  }

  function handleAdd(formData: FormData) {
    setError(undefined);

    startTransition(async () => {
      // --- Opción 1: link de YouTube / Vimeo ---
      if (mode === "url") {
        const result = await addHighlightVideo(playerId, formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        closeModal();
        router.refresh();
        return;
      }

      // --- Opción 2: archivo subido desde el dispositivo ---
      const title = String(formData.get("title") ?? "").trim();
      if (!title) {
        setError("El título es obligatorio.");
        return;
      }
      if (!file) {
        setError("Elegí un archivo de video.");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Tenés que iniciar sesión.");
        return;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const storagePath = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(VIDEO_BUCKET)
        .upload(storagePath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        setError("No pudimos subir el video. Probá de nuevo.");
        return;
      }

      const result = await addHighlightVideoFile(playerId, title, storagePath);
      if (result.error) {
        setError(result.error);
        return;
      }
      closeModal();
      router.refresh();
    });
  }

  function handleDelete(videoId: string) {
    startTransition(async () => {
      await deleteHighlightVideo(videoId, playerId);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {videos.length === 0 ? (
        <EmptyState title="Todavía no agregaste videos de highlights." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              actions={
                editable ? (
                  <button
                    onClick={() => handleDelete(video.id)}
                    aria-label={`Eliminar video ${video.title}`}
                    className="shrink-0 rounded-md p-1.5 text-text-muted hover:bg-bg-subtle hover:text-danger"
                  >
                    ✕
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      )}

      {editable && (
        <>
          <Button
            variant="secondary"
            size="sm"
            className="self-start"
            onClick={() => setOpen(true)}
          >
            + Agregar video
          </Button>
          <Modal open={open} onClose={closeModal} title="Agregar video de highlights">
            <form action={handleAdd} className="flex flex-col gap-4">
              <Input label="Título" name="title" required />

              {/* Selector: link o archivo */}
              <div
                role="tablist"
                aria-label="Cómo querés cargar el video"
                className="grid grid-cols-2 gap-1 rounded-lg bg-bg-subtle p-1"
              >
                {(
                  [
                    ["url", "Link (URL)"],
                    ["file", "Subir archivo"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => {
                      setMode(value);
                      setError(undefined);
                    }}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      mode === value
                        ? "bg-surface text-text shadow-sm"
                        : "text-text-muted hover:text-text",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mode === "url" ? (
                <Input
                  label="URL del video"
                  name="url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  hint="Youtube o Vimeo."
                  required
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-text">Archivo de video</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_VIDEO_MIME.join(",")}
                    onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    className="sr-only"
                    id="video-file"
                  />
                  <label
                    htmlFor="video-file"
                    className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-border px-4 py-6 text-center transition-colors hover:border-accent hover:bg-bg-subtle focus-within:outline-2"
                  >
                    {file ? (
                      <>
                        <span className="max-w-full truncate text-sm font-medium text-text">
                          {file.name}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatSize(file.size)} · tocá para cambiarlo
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-text">
                          Elegí un video de tu dispositivo
                        </span>
                        <span className="text-xs text-text-muted">
                          MP4, MOV o WebM. Hasta {MAX_VIDEO_FILE_MB} MB.
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}

              {error && (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              )}
              <div className="mt-1 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" isLoading={isPending}>
                  {mode === "file" ? "Subir video" : "Agregar"}
                </Button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  );
}
