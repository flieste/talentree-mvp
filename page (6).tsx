import Link from "next/link";
import { getAdminCounts, requireAdmin } from "@/lib/data/admin";

export const metadata = { title: "Panel — TalenTree" };

export default async function AdminHomePage() {
  await requireAdmin();
  const counts = await getAdminCounts();

  const cards = [
    { href: "/admin/solicitudes", title: "Solicitudes de clubes", value: counts.requests, hint: "pendientes de revisar" },
    { href: "/admin/avisos", title: "Avisos de clubes", value: counts.announcements, hint: "esperando tu decisión" },
    { href: "/admin/noticias", title: "Noticias y eventos", value: counts.news, hint: "publicadas en la app" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Panel de TalenTree</h1>
        <p className="mt-1 text-text-muted">Gestioná las cuentas de clubes, sus avisos y las noticias de la app.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
          >
            <span className="text-sm text-text-muted">{c.title}</span>
            <span className="font-display text-4xl font-semibold">{c.value}</span>
            <span className="text-sm text-text-muted">{c.hint}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
