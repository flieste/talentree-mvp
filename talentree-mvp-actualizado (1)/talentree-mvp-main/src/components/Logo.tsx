import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo oficial de TalenTree (árbol con pelotas de fútbol + wordmark),
 * provisto por el cliente. El archivo fuente vive en /public/logo.png
 * y se usa tal cual, sin recolorear ni rediseñar — solo se recortó el
 * margen sobrante del lienzo original para que funcione bien como
 * insignia. Se usa completo (con nombre) en el Inicio y en el login; en el
 * header se usa el isotipo minimalista de components/LogoMark.tsx.
 */

const LOGO_ASPECT_RATIO = 623 / 444;

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const widths = {
  sm: 96,
  md: 140,
  lg: 208,
  xl: 280,
};

export function Logo({ className, size = "md" }: LogoProps) {
  const width = widths[size];
  const height = Math.round(width / LOGO_ASPECT_RATIO);

  return (
    <span
      className={cn(
        "inline-block overflow-hidden rounded-xl leading-none",
        className,
      )}
      style={{ width, height }}
    >
      <Image
        src="/logo.png"
        alt="TalenTree"
        width={width}
        height={height}
        priority
        className="h-full w-full object-cover"
      />
    </span>
  );
}
