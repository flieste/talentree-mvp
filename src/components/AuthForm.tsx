import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";

interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthForm({ title, subtitle, children, footer }: AuthFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-subtle px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8">
        <div className="mb-6 flex flex-col items-center gap-4 text-center">
          <Logo size="lg" />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {children}
        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}
