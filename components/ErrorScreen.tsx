/**
 * ErrorScreen — shared composition for the site's error pages (404 / 500).
 *
 * Design: open, centered composition over the sunken surface (deliberately
 * NOT the login card — an error is a message, not a form). The navbar's
 * accent bar reappears at the top to anchor the page to the site identity,
 * and the giant code renders its last digit in accent outline. All colors
 * come from the --color-foues-* theme vars, so dark mode works for free.
 *
 * Server-safe (no client hooks) — error.tsx wraps it from a client boundary.
 */

import Link from "next/link";
import { RestoreTheme } from "@/components/RestoreTheme";

// Same pre-paint logic as the root layout: error pages re-render the
// document, so the attribute must be set again before first paint (and
// RestoreTheme covers the post-hydration wipe).
const PREPAINT =
  "(function(){try{var t=localStorage.getItem('foues-theme');if(t==='dark')document.documentElement.dataset.fouesTheme='dark'}catch(e){}})()";

interface ErrorScreenProps {
  /** Big status code; the last character is rendered in accent outline. */
  code: string;
  /** Uppercase eyebrow over the code (e.g. "Página no encontrada"). */
  eyebrow: string;
  title: string;
  message: string;
  /** Extra actions rendered next to the primary "Volver al inicio" link. */
  actions?: React.ReactNode;
  /** Optional fine print under the actions (e.g. error digest). */
  footnote?: React.ReactNode;
}

export function ErrorScreen({
  code,
  eyebrow,
  title,
  message,
  actions,
  footnote,
}: ErrorScreenProps) {
  const head = code.slice(0, -1);
  const last = code.slice(-1);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-foues-surface-sunken)]">
      <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      <RestoreTheme />
      {/* Eco de la barra superior del navbar — ancla de identidad */}
      <div
        aria-hidden
        className="h-1.5 w-full"
        style={{ backgroundColor: "var(--color-foues-accent)" }}
      />

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: "var(--color-foues-text-muted)" }}
        >
          {eyebrow}
        </p>

        <p
          aria-hidden
          className="mt-2 text-[clamp(6rem,24vw,11rem)] font-black leading-none tracking-tighter select-none"
          style={{ color: "var(--color-foues-navy)" }}
        >
          {head}
          <span
            style={{
              color: "transparent",
              WebkitTextStroke: "3px var(--color-foues-accent)",
            }}
          >
            {last}
          </span>
        </p>

        <h1
          className="mt-6 text-xl font-bold sm:text-2xl"
          style={{ color: "var(--color-foues-text-strong)" }}
        >
          {title}
        </h1>

        <p
          className="mt-2 max-w-md text-sm leading-relaxed sm:text-base"
          style={{ color: "var(--color-foues-text-secondary)" }}
        >
          {message}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foues-accent)]"
            style={{ backgroundColor: "var(--color-foues-navy)" }}
          >
            Volver al inicio
          </Link>
          {actions}
        </div>

        {footnote && (
          <div
            className="mt-10 text-xs"
            style={{ color: "var(--color-foues-text-faint)" }}
          >
            {footnote}
          </div>
        )}
      </main>

      {/* Identidad institucional discreta al pie */}
      <footer className="pb-8 text-center">
        <p
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: "var(--color-foues-text-faint)" }}
        >
          Facultad de Odontología — Universidad de El Salvador
        </p>
      </footer>
    </div>
  );
}
