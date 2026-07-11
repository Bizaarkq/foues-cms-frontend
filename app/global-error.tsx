"use client";

/**
 * app/global-error.tsx — last-resort boundary: catches errors thrown by the
 * root layout itself. It REPLACES the whole document, so nothing from
 * layout.tsx exists here (no globals.css, no ThemeVars, no theme toggle).
 * Fully self-contained on purpose: brand colors hardcoded (light + dark via
 * prefers-color-scheme) and zero app imports beyond React.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>
        <style>{`
          :root {
            --ge-navy: #042154;
            --ge-accent: #8466ac;
            --ge-surface: #f1f5f9;
            --ge-text-strong: #1f2937;
            --ge-text-secondary: #4b5563;
            --ge-text-faint: #9ca3af;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --ge-navy: #4d82d6;
              --ge-accent: #a888cc;
              --ge-surface: #0f172a;
              --ge-text-strong: #f8fafc;
              --ge-text-secondary: #94a3b8;
              --ge-text-faint: #9ca3af;
            }
          }
        `}</style>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            background: "var(--ge-surface)",
            fontFamily:
              'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
            textAlign: "center",
          }}
        >
          <div style={{ height: 6, background: "var(--ge-accent)" }} aria-hidden />
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "4rem 1.5rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--ge-text-faint)",
              }}
            >
              Error del sitio
            </p>
            <p
              aria-hidden
              style={{
                margin: "0.5rem 0 0",
                fontSize: "clamp(6rem, 24vw, 11rem)",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.05em",
                color: "var(--ge-navy)",
                userSelect: "none",
              }}
            >
              50
              <span
                style={{
                  color: "transparent",
                  WebkitTextStroke: "3px var(--ge-accent)",
                }}
              >
                0
              </span>
            </p>
            <h1
              style={{
                margin: "1.5rem 0 0",
                fontSize: "1.375rem",
                color: "var(--ge-text-strong)",
              }}
            >
              El sitio tuvo un problema
            </h1>
            <p
              style={{
                margin: "0.5rem 0 0",
                maxWidth: "28rem",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                color: "var(--ge-text-secondary)",
              }}
            >
              Ocurrió un error inesperado. Reintentá en unos segundos; si el
              problema sigue, avisanos.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "2rem",
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: 700,
                color: "#ffffff",
                background: "var(--ge-navy)",
                border: 0,
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            {error.digest && (
              <p
                style={{
                  marginTop: "2.5rem",
                  fontSize: "0.75rem",
                  color: "var(--ge-text-faint)",
                }}
              >
                Código de referencia:{" "}
                <code style={{ fontFamily: "ui-monospace, monospace" }}>
                  {error.digest}
                </code>
              </p>
            )}
          </main>
          <footer style={{ paddingBottom: "2rem" }}>
            <p
              style={{
                margin: 0,
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--ge-text-faint)",
              }}
            >
              Facultad de Odontología — Universidad de El Salvador
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
