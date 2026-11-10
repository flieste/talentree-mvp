import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/data/admin";

/** Todo lo que cuelga de /admin exige un mail autorizado (se verifica en la base). */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
