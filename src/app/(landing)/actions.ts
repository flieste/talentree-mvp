"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils";

export interface WaitlistState {
  status: "idle" | "ok" | "error";
  message?: string;
  /** Lo que escribió la persona, para no perderlo si hay un error. */
  values?: { name: string; email: string; contact: string };
}

const SOURCE_RE = /^[a-z0-9_.-]{1,40}$/i;

/**
 * Anota a una persona en la lista de espera de la landing (tabla `waitlist`).
 * La tabla solo permite insertar; ver supabase/migrations/0006_waitlist.sql.
 */
export async function joinWaitlist(
  _prev: WaitlistState | undefined,
  formData: FormData,
): Promise<WaitlistState> {
  // Campo trampa para bots: las personas no lo ven ni lo completan.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { status: "ok" };
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();
  const consent = formData.get("consent") === "on";
  const rawSource = String(formData.get("source") ?? "").trim();
  const source = SOURCE_RE.test(rawSource) ? rawSource.toLowerCase() : null;
  const values = { name, email, contact };

  if (!name || name.length > 80) {
    return { status: "error", message: "Escribí tu nombre.", values };
  }
  if (!isValidEmail(email) || email.length > 254) {
    return { status: "error", message: "Ingresá un email válido.", values };
  }
  if (contact.length < 3 || contact.length > 80) {
    return {
      status: "error",
      message: "Dejanos un WhatsApp o un usuario de Instagram para contactarte.",
      values,
    };
  }
  if (!consent) {
    return {
      status: "error",
      message: "Marcá la casilla para que podamos contactarte.",
      values,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("waitlist")
    .insert({ name, email, contact, source, consent: true });

  // 23505 = el email ya estaba anotado. Se responde igual que un alta nueva
  // para no revelar qué emails ya están en la lista.
  if (error && error.code !== "23505") {
    return {
      status: "error",
      message: "No pudimos guardar tus datos. Probá de nuevo en unos minutos.",
      values,
    };
  }

  return { status: "ok" };
}
