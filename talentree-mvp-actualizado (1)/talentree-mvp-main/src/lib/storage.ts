/**
 * Ruta dentro de un bucket de Supabase Storage a partir de la URL pública de un archivo.
 * Devuelve null si la URL no pertenece a ese bucket.
 */
export function storagePathFromUrl(url: string | null | undefined, bucket: string): string | null {
  if (!url) return null;
  const marker = `/${bucket}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}
