"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClubLogo } from "@/components/ClubLogo";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { removeClubLogo, updateClubLogo } from "@/app/(app)/profile/club-actions";
import { createClient } from "@/lib/supabase/client";
import { ACCEPTED_IMAGE_MIME, AVATAR_BUCKET, MAX_AVATAR_MB } from "@/lib/constants";
import { fitInside } from "@/lib/image";
import type { Club } from "@/lib/types";

/**
 * Escudo del club editable: hace de "foto de perfil" del club. A diferencia de
 * la foto de un jugador, no se recorta en cuadrado: se achica entero y se
 * conserva la transparencia.
 */
export function ClubLogoEditor({ club }: { club: Club }) {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
      setError("El escudo tiene que ser JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setError(`El archivo pesa más de ${MAX_AVATAR_MB} MB.`);
      return;
    }
    try {
      const fitted = await fitInside(file);
      setBlob(fitted);
      setPreview(URL.createObjectURL(fitted));
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

      const storagePath = `${user.id}/${crypto.randomUUID()}.png`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(storagePath, blob, { contentType: "image/png", upsert: false });
      if (uploadError) {
        setError("No pudimos subir el escudo. Probá de nuevo.");
        return;
      }

      const result = await updateClubLogo(storagePath);
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
      const result = await removeClubLogo();
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
        aria-label="Cambiar escudo del club"
        className="relative shrink-0 rounded-xl"
      >
        <ClubLogo club={club} size="lg" />
        <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-accent text-accent-contrast">
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

      <Modal open={open} onClose={close} title="Escudo del club">
        <div className="flex flex-col items-center gap-4">
          {preview ? (
            <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-white p-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- vista previa local (blob:) */}
              <img src={preview} alt="Vista previa del escudo" className="h-full w-full object-contain" />
            </div>
          ) : (
            <ClubLogo club={club} size="xl" />
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
            {preview || club.logo_url ? "Elegir otro escudo" : "Elegir el escudo"}
          </Button>
          <p className="text-center text-xs text-text-muted">
            JPG, PNG o WebP, hasta {MAX_AVATAR_MB} MB. Se muestra entero, sin recortar. Si tiene
            fondo transparente, mejor en PNG.
          </p>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-1 flex w-full items-center justify-between gap-2">
            {club.logo_url ? (
              <Button type="button" variant="danger" size="sm" onClick={handleRemove} disabled={isPending}>
                Quitar escudo
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={close}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSave} disabled={!blob} isLoading={isPending}>
                Guardar escudo
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
