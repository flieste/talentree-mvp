import type { ReactNode } from "react";
import type { HighlightVideo } from "@/lib/types";
import { isSafeHttpUrl, toEmbedUrl } from "@/lib/utils";

interface VideoCardProps {
  video: HighlightVideo;
  actions?: ReactNode;
}

export function VideoCard({ video, actions }: VideoCardProps) {
  const embedUrl = toEmbedUrl(video.url);
  // Defensa en profundidad: la base de datos ya exige http(s) (ver migración
  // 0005), pero volvemos a chequearlo acá antes de usar la URL como
  // src/href para no confiar ciegamente en el dato al momento de renderizar.
  const safeUrl = isSafeHttpUrl(video.url) ? video.url : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-video w-full bg-bg-subtle">
        {!safeUrl ? (
          <div className="flex h-full w-full items-center justify-center text-sm text-text-muted">
            Video no disponible
          </div>
        ) : video.source === "file" ? (
          <video
            src={safeUrl}
            title={video.title}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black"
          />
        ) : embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="h-full w-full"
          />
        ) : (
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-accent hover:underline"
          >
            Ver video
          </a>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="truncate text-sm font-medium text-text">{video.title}</p>
        {actions}
      </div>
    </div>
  );
}
