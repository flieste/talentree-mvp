import type { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ProfileSection({ title, action, children }: ProfileSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
