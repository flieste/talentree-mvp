import { ThemeToggle } from "@/components/ThemeToggle";

export default function SettingsPage() {
  return (
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Configuración
      </h1>
      <ThemeToggle />
    </div>
  );
}
