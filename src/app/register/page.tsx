import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <AuthForm
      title="Crear cuenta"
      subtitle="Sumate a TalenTree y ganá visibilidad"
      footer={
        <span className="text-text-muted">
          ¿Ya tenés una cuenta?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Ya tengo una cuenta
          </Link>
        </span>
      }
    >
      <RegisterForm />
    </AuthForm>
  );
}
