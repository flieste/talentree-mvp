import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { getRole } from "@/lib/data/auth";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const role = (await getRole()) ?? "player";
  return <AppShell role={role}>{children}</AppShell>;
}
