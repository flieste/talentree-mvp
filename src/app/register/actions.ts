"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/utils";

export interface RegisterState {
  error?: string;
}

export async function register(
  _prevState: RegisterState | undefined,
  formData: FormData,
): Promise<RegisterState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!firstName) return { error: "El nombre es obligatorio." };
  if (!lastName) return { error: "El apellido es obligatorio." };
  if (!email || !isValidEmail(email)) {
    return { error: "Ingresá un email válido." };
  }

  const parsedBirthDate = new Date(birthDate);
  if (!birthDate || Number.isNaN(parsedBirthDate.getTime())) {
    return { error: "Ingresá una fecha de nacimiento válida." };
  }
  if (parsedBirthDate.getTime() > Date.now()) {
    return { error: "La fecha de nacimiento no puede ser futura." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: "player",
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
      },
    },
  });

  if (error) {
    // Queda en los logs del hosting (Vercel -> Logs) con el motivo real.
    console.error("[register] signUp falló:", {
      code: error.code,
      status: error.status,
      message: error.message,
    });

    const msg = error.message.toLowerCase();

    if (error.code === "user_already_exists" || msg.includes("already registered")) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    if (error.code === "weak_password") {
      return { error: "La contraseña es demasiado débil. Probá con una más larga o con más variedad de caracteres." };
    }
    if (error.code === "email_address_invalid") {
      return { error: "Ese email no es válido o su dominio no es aceptado." };
    }
    if (error.code === "email_address_not_authorized") {
      return { error: "Este email no está autorizado para recibir correos de confirmación. Falta configurar el envío de emails del proyecto." };
    }
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { error: "Se alcanzó el límite de emails o de intentos. Esperá un rato y volvé a probar." };
    }
    if (error.code === "signup_disabled" || error.code === "email_provider_disabled") {
      return { error: "El registro está desactivado en este momento." };
    }

    // Caso genérico: se agrega el código técnico para poder diagnosticar.
    // (Cuando esté todo funcionando se puede sacar el sufijo.)
    const detail = error.code ?? (error.status ? `HTTP ${error.status}` : "sin código");
    return { error: `No pudimos crear la cuenta. Intentá de nuevo. (Detalle técnico: ${detail})` };
  }

  if (data.session) {
    redirect("/");
  }

  // El proyecto de Supabase tiene activada la confirmación por email.
  redirect("/login?registered=1");
}
