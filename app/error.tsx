"use client";

/**
 * app/error.tsx — runtime error boundary for the whole route tree (the
 * public face of a 500). Client component by Next.js contract: receives
 * the error and a reset() that re-renders the failed segment.
 *
 * The digest (Next's server-side error correlation id) is surfaced as fine
 * print so a visitor can report something actionable to soporte.
 */

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Server logs have the full stack; this correlates the client report.
    console.error("[error-boundary]", error.digest ?? error.message);
  }, [error]);

  return (
    <ErrorScreen
      code="500"
      eyebrow="Error del servidor"
      title="Algo salió mal"
      message="Ocurrió un error inesperado al cargar esta página. Reintentá en unos segundos; si el problema sigue, avisanos."
      actions={
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border px-6 py-3 text-sm font-bold transition-colors hover:bg-[var(--color-foues-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foues-accent)]"
          style={{
            borderColor: "var(--color-foues-navy)",
            color: "var(--color-foues-navy)",
          }}
        >
          Reintentar
        </button>
      }
      footnote={
        error.digest ? (
          <p>
            Código de referencia: <code className="font-mono">{error.digest}</code>
          </p>
        ) : undefined
      }
    />
  );
}
