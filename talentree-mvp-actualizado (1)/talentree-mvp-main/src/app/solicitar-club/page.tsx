import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { ClubRequestForm } from "@/components/ClubRequestForm";

export const metadata = { title: "Solicitar cuenta de club — TalenTree" };

export default function ClubRequestPage() {
  return (
    <AuthForm
      title="Solicitar cuenta de club"
      subtitle="Las cuentas de club las creamos nosotros. Dejanos tus datos y te contactamos."
      footer={
        <span className="text-text-muted">
          ¿Sos jugador?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Crear cuenta de jugador
          </Link>
        </span>
      }
    >
      <ClubRequestForm />
    </AuthForm>
  );
}
