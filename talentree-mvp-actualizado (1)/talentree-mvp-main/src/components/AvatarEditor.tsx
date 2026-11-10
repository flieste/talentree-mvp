"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { removeAvatar, updateAvatar } from "@/app/(app)/profile/actions";
import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_IMAGE_MIME, AVATAR_BUCKET, MAX_AVATAR_MB } from "@/lib/constants";
import { cropSquare } from "@/lib/image";
import type { Player } from "@/lib/types";

/**
 * Foto de perfil editable (solo el dueño del perfil). Al elegir una imagen se
 * recorta al cuadrado en el navegador y se muestra una vista previa antes de guardar.
 */
export function AvatarEditor({ player }: { player: Player }) {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Libera la URL temporal de la vista previa cuando cambia o se cierra.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function close() {
    setOpen(false);
    setBlob(null);
    setPreview(null);
    setError(undefined);
  }

  async function handleFile(file: File | null) {
    setError(undefined);
    if (!file) return;
    if (!ACCEPTED_IMAGE_MIME.includes(file.type)) {
      setError("La foto tiene que ser JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setError(`La foto pesa más de ${MAX_AVATAR_MB} MB.`);
      return;
    }
    try {
      const cropped = await cropSquare(file);
      setBlob(cropped);
      setPreview(URL.createObjectURL(cropped));
    } catch {
      setError("No pudimos leer esa imagen. Probá con otra.");
    }
  }

  function handleSave() {
    if (!blob) return;
    setError(undefined);
    startTransition(async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Tenés que iniciar sesión.");
        return;
      }

      // Nombre único: evita que el navegador muestre la foto vieja en caché.
      const storagePath = `${user.id}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(storagePath, blob, { contentType: "image/jpeg", upsert: false });
      if (uploadError) {
        setError("No pudimos subir la foto. Probá de nuevo.");
        return;
      }

      const result = await updateAvatar(player.id, storagePath);
      if (result.error) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  function handleRemove() {
    setError(undefined);
    startTransition(async () => {
      const result = await removeAvatar(player.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Cambiar foto de perfil"
        className="group relative shrink-0 rounded-full"
      >
        <Avatar player={player} size="lg" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-accent text-accent-contrast">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 100-8 4 4 0 000 8z"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <Modal open={open} onClose={close} title="Foto de perfil">
        <div className="flex flex-col items-center gap-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:)
            <img src={preview} alt="Vista previa" className="h-28 w-28 rounded-full object-cover" />
          ) : (
            <Avatar player={player} size="xl" />
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_MIME.join(",")}
            className="sr-only"
            onChange={(e) => {
              void handleFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            {preview || player.avatar_url ? "Elegir otra foto" : "Elegir una foto"}
          </Button>
          <p className="text-center text-xs text-text-muted">
            JPG, PNG o WebP, hasta {MAX_AVATAR_MB} MB. La foto se recorta en cuadrado.
          </p>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-1 flex w-full items-center justify-between gap-2">
            {player.avatar_url ? (
              <Button type="button" variant="danger" size="sm" onClick={handleRemove} disabled={isPending}>
                Quitar foto
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={!blob} isLoading={isPending}>
                Guardar foto
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
