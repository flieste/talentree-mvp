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
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ya existe una cuenta con ese email." };
    }
    return { error: "No pudimos crear la cuenta. Intentá de nuevo." };
  }

  if (data.session) {
    redirect("/");
  }

  // El proyecto de Supabase tiene activada la confirmación por email.
  redirect("/login?registered=1");
}
