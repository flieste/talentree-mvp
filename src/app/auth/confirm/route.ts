import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Entrada de los links de acceso que genera el panel de TalenTree para los
 * clubes recién aprobados. Canjea el token (sirve desde cualquier navegador)
 * y manda a la persona a elegir su contraseña.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/inicio";
  // Solo rutas internas: evita que el link redirija a otro sitio.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/inicio";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(safeNext, origin));
  }
  return NextResponse.redirect(new URL("/login?link=vencido", origin));
}
