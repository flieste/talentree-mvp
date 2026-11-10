"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface UpdatePasswordState {
  error?: string;
}

export async function updatePassword(
  _prev: UpdatePasswordState | undefined,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) return { error: "La contraseña tiene que tener al menos 8 caracteres." };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu link venció. Pedile uno nuevo a TalenTree." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "No pudimos guardar la contraseña. Probá con otra." };

  redirect("/inicio");
}
