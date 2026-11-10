import { AdminClubRequests } from "@/components/AdminClubRequests";
import { getClubRequests } from "@/lib/data/admin";

export const metadata = { title: "Solicitudes de clubes — TalenTree" };

export default async function AdminRequestsPage() {
  const requests = await getClubRequests();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Solicitudes de clubes</h1>
        <p className="mt-1 text-text-muted">
          Al aprobar una solicitud se crea la cuenta del club y se genera un link para que elija su contraseña.
        </p>
      </div>
      <AdminClubRequests requests={requests} />
    </div>
  );
}
