"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Sin permiso de portapapeles: la persona puede copiar el texto a mano.
        }
      }}
    >
      {copied ? "Copiado" : label}
    </Button>
  );
}
