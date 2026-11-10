import { AdminAnnouncements } from "@/components/AdminAnnouncements";
import { getAllAnnouncements } from "@/lib/data/admin";

export const metadata = { title: "Avisos de clubes — TalenTree" };

export default async function AdminAnnouncementsPage() {
  const announcements = await getAllAnnouncements();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Avisos de clubes</h1>
        <p className="mt-1 text-text-muted">
          Publicar un aviso lo agrega a Noticias y eventos. Si no lo publicás, podés dejarle una nota al club.
        </p>
      </div>
      <AdminAnnouncements announcements={announcements} />
    </div>
  );
}
