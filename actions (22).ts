"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils";

export interface ClubRequestState {
  status: "idle" | "ok" | "error";
  message?: string;
  /** Lo que escribió la persona, para no perderlo si hay un error. */
  values?: Record<string, string>;
}

const FIELDS = ["clubName", "city", "contactName", "roleTitle", "email", "phone", "message"] as const;

/**
 * Guarda una solicitud de cuenta de club (tabla `club_requests`).
 * La tabla solo permite insertar; ver supabase/migrations/0007_club_requests.sql.
 */
export async function requestClubAccount(
  _prev: ClubRequestState | undefined,
  formData: FormData,
): Promise<ClubRequestState> {
  // Campo trampa para bots: las personas no lo ven ni lo completan.
  if (String(formData.get("website") ?? "").trim() !== "") return { status: "ok" };

  const v = Object.fromEntries(
    FIELDS.map((f) => [f, String(formData.get(f) ?? "").trim()]),
  ) as Record<(typeof FIELDS)[number], string>;
  const fail = (message: string): ClubRequestState => ({ status: "error", message, values: v });

  if (!v.clubName || v.clubName.length > 100) return fail("Escribí el nombre del club.");
  if (v.city.length > 80) return fail("La ciudad es demasiado larga.");
  if (!v.contactName || v.contactName.length > 80) return fail("Escribí el nombre de la persona de contacto.");
  if (v.roleTitle.length > 60) return fail("El cargo es demasiado largo.");
  if (!isValidEmail(v.email) || v.email.length > 254) return fail("Ingresá un email válido.");
  if (v.phone.length > 40) return fail("El teléfono es demasiado largo.");
  if (v.message.length > 1000) return fail("El mensaje no puede superar los 1000 caracteres.");
  if (formData.get("consent") !== "on") {
    return fail("Marcá la casilla para que podamos contactarte.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("club_requests").insert({
    club_name: v.clubName,
    city: v.city || null,
    contact_name: v.contactName,
    role_title: v.roleTitle || null,
    email: v.email,
    phone: v.phone || null,
    message: v.message || null,
    consent: true,
  });

  // 23505 = ya hay una solicitud pendiente con ese email. Se responde igual que
  // un alta nueva para no revelar qué emails ya pidieron cuenta.
  if (error && error.code !== "23505") {
    console.error("[solicitar-club] insert falló:", error.code, error.message);
    return fail("No pudimos enviar la solicitud. Probá de nuevo en unos minutos.");
  }
  return { status: "ok" };
}
