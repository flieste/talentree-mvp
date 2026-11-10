import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Convierte una fecha ISO (yyyy-mm-dd) en un Date en horario LOCAL.
 * `new Date("yyyy-mm-dd")` la interpreta como medianoche UTC, lo que hace
 * que en husos horarios negativos (como Argentina, UTC-3) se muestre un
 * día antes del real. Todo el código que necesite mostrar o comparar
 * fechas guardadas como yyyy-mm-dd debe pasar por acá en lugar de usar
 * `new Date(...)` directamente.
 */
export function parseLocalDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/**
 * Calcula la edad en años a partir de una fecha de nacimiento (ISO yyyy-mm-dd).
 * La edad nunca se guarda manualmente: siempre se deriva de birth_date.
 */
export function calculateAge(birthDate: string): number {
  const birth = parseLocalDate(birthDate);
  if (!birth || Number.isNaN(birth.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return Math.max(age, 0);
}

export function formatHeight(heightCm: number | null): string {
  if (!heightCm) return "Sin datos";
  return `${(heightCm / 100).toFixed(2)} m`;
}

export function formatWeight(weightKg: number | null): string {
  if (!weightKg) return "Sin datos";
  return `${weightKg} kg`;
}

const VIDEO_HOST_ALLOWLIST = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "vimeo.com",
  "www.vimeo.com",
  "player.vimeo.com",
];

/**
 * Valida que la URL sea una URL bien formada y, preferentemente,
 * de una plataforma de video compatible (YouTube / Vimeo).
 */
export function isValidVideoUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    return VIDEO_HOST_ALLOWLIST.some((host) => url.hostname === host);
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Defensa en profundidad para cualquier URL que venga de la base de datos
 * (video, link de noticia) y se vaya a usar como href/src. La base de datos
 * ya exige http(s) por un CHECK constraint, pero esta función vuelve a
 * validarlo del lado del render: si alguna fila vieja o algún dato cargado
 * por otra vía tuviera un esquema peligroso (javascript:, data:, etc.), acá
 * se corta antes de renderizar el link.
 */
export function isSafeHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Convierte una URL de YouTube o Vimeo en una URL de embed apta para <iframe>.
 * Si no reconoce el formato, devuelve null y el video se muestra como link.
 */
export function toEmbedUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);

    if (url.hostname === "youtu.be") {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (url.hostname.endsWith("youtube.com")) {
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (url.pathname.startsWith("/embed/")) return url.toString();
      return null;
    }

    if (url.hostname.endsWith("vimeo.com")) {
      const match = url.pathname.match(/\/(\d+)/);
      if (match) return `https://player.vimeo.com/video/${match[1]}`;
      return null;
    }

    return null;
  } catch {
    return null;
  }
}

export function fullName(p: { first_name: string; last_name: string }): string {
  return `${p.first_name} ${p.last_name}`.trim();
}
