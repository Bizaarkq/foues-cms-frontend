import Link from "next/link";
import type { ButtonVariant } from "@/types/elements";

/**
 * Shared button look for the whole site: one filled primary and one outlined
 * secondary, 44px tall, same radius everywhere.
 *
 * - `tone="inverse"` is for buttons sitting on a dark ground (the hero).
 * - `buttonClass()` is exported for real <button> elements (form submits).
 */

export type ButtonKind = "primary" | "secondary";
export type ButtonTone = "default" | "inverse";

const BASE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-foues-control)] border px-5 text-base font-medium " +
  "transition duration-150 ease-out motion-safe:hover:-translate-y-px motion-safe:active:translate-y-px motion-safe:active:scale-[.985] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2";

const LOOK: Record<ButtonTone, Record<ButtonKind, string>> = {
  default: {
    primary:
      "border-transparent bg-[var(--color-foues-action-primary)] text-[var(--color-foues-on-action)] " +
      "hover:bg-[var(--color-foues-action-primary-hover)] focus-visible:outline-[var(--color-foues-accent)]",
    secondary:
      "border-[color-mix(in_srgb,var(--color-foues-text-base)_28%,transparent)] bg-transparent text-[var(--color-foues-text-base)] " +
      "hover:border-[var(--color-foues-text-base)] hover:bg-[color-mix(in_srgb,var(--color-foues-text-base)_5%,transparent)] " +
      "focus-visible:outline-[var(--color-foues-accent)]",
  },
  inverse: {
    primary:
      "border-transparent bg-white text-[var(--color-foues-inverse-ink)] hover:bg-white/90 focus-visible:outline-white",
    secondary:
      "border-white/60 bg-transparent text-white hover:border-white hover:bg-white/10 focus-visible:outline-white",
  },
};

/** Maps the CMS `elements.button` variant onto the two site kinds. */
export function kindFromVariant(variant: ButtonVariant | null | undefined): ButtonKind {
  return !variant || variant.includes("filled") ? "primary" : "secondary";
}

export function buttonClass(kind: ButtonKind = "primary", tone: ButtonTone = "default"): string {
  return `${BASE} ${LOOK[tone][kind]}`;
}

interface ButtonLinkProps {
  label: string;
  url: string | null;
  kind?: ButtonKind;
  tone?: ButtonTone;
}

/** Link styled as a button. Without a URL it renders as a disabled-looking span. */
export function ButtonLink({ label, url, kind = "primary", tone = "default" }: ButtonLinkProps) {
  const className = buttonClass(kind, tone);

  if (!url) {
    return <span className={`${className} cursor-not-allowed opacity-60`}>{label}</span>;
  }

  return (
    <Link href={url} className={className}>
      {label}
    </Link>
  );
}
