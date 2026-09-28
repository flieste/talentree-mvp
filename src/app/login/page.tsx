import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;

  return (
    <AuthForm
      title="Iniciar sesión"
      subtitle="Entrá a tu cuenta de TalenTree"
      footer={
        <span className="text-text-muted">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Crear cuenta
          </Link>
        </span>
      }
    >
      {registered && (
        <p className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent-strong">
          Cuenta creada. Revisá tu email para confirmarla y después iniciá sesión.
        </p>
      )}
      <LoginForm />
    </AuthForm>
  );
}
