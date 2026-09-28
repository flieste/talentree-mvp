import { SUPPORT_EMAIL } from "@/lib/constants";

export default function HelpPage() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        ¿Necesitás ayuda?
      </h1>
      <p className="text-text-muted">
        Si tenés dudas sobre tu cuenta, tu perfil o cómo funciona TalenTree,
        escribinos y te ayudamos a resolverlo.
      </p>
      <div className="rounded-xl border border-border bg-surface p-5">
        <p className="text-sm text-text-muted">Contacto de soporte</p>
        <p className="font-medium text-text">{SUPPORT_EMAIL}</p>
      </div>
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-[0.95rem] font-medium text-accent-contrast transition-colors hover:bg-accent-strong"
      >
        Contactar soporte
      </a>
    </div>
  );
}
