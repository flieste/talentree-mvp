import { AdminNewsManager } from "@/components/AdminNewsManager";
import { getAdminNews } from "@/lib/data/admin";

export const metadata = { title: "Noticias y eventos — TalenTree" };

export default async function AdminNewsPage() {
  const news = await getAdminNews();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Noticias y eventos</h1>
        <p className="mt-1 text-text-muted">Los anuncios propios de TalenTree y los que publicaste desde los avisos de clubes.</p>
      </div>
      <AdminNewsManager news={news} />
    </div>
  );
}
