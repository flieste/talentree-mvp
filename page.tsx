import { AuthForm } from "@/components/AuthForm";
import { UpdatePasswordForm } from "@/components/UpdatePasswordForm";

export const metadata = { title: "Elegí tu contraseña — TalenTree" };

export default function UpdatePasswordPage() {
  return (
    <AuthForm title="Elegí tu contraseña" subtitle="Con ella vas a entrar a tu cuenta de TalenTree.">
      <UpdatePasswordForm />
    </AuthForm>
  );
}
