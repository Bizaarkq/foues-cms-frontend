import Link from "next/link";
import type { InfoCardProps } from "@/types/blocks";
import type { ButtonElement } from "@/types/elements";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foues-accent)]";
const FILLED_CLASS = `inline-flex h-[52px] items-center rounded-lg px-8 text-base font-bold text-white transition hover:opacity-90 ${FOCUS_RING}`;
const GHOST_CLASS = `inline-flex h-[52px] items-center rounded-lg border-2 px-8 text-base font-bold transition hover:opacity-80 ${FOCUS_RING}`;

function CtaButton({ cta }: { cta: ButtonElement }) {
  const isFilled = cta.variant?.includes("filled") ?? true;
  const className = isFilled ? FILLED_CLASS : GHOST_CLASS;
  const style = isFilled
    ? { backgroundColor: "var(--color-foues-accent)" }
    : { borderColor: "var(--color-foues-accent)", color: "var(--color-foues-accent)" };

  return cta.url ? (
    <Link href={cta.url} className={className} style={style}>
      {cta.label}
    </Link>
  ) : (
    <span className={`${className} cursor-not-allowed opacity-60`} style={style}>
      {cta.label}
    </span>
  );
}

export default function InfoCard({ title, body, cta }: InfoCardProps) {
  return (
    <section className="w-full py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        <div
          className="rounded-xl border bg-[var(--color-foues-surface-raised)] p-8 shadow-sm md:p-10"
          style={{ borderColor: "color-mix(in srgb, var(--color-foues-navy) 10%, transparent)" }}
        >
          {title && (
            <div className="mb-6">
              <h2
                className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
                style={{ color: "var(--color-foues-navy)" }}
              >
                {title}
              </h2>
              <span
                className="mt-2 block h-1 w-16 rounded-full"
                style={{ backgroundColor: "var(--color-foues-accent)" }}
                aria-hidden="true"
              />
            </div>
          )}

          {body && (
            <div
              className="prose prose-sm max-w-none mt-6 md:prose-base"
              style={{ color: "color-mix(in srgb, var(--color-foues-navy) 90%, transparent)" }}
              // Strapi v5 richtext is admin-authored HTML — trust the source
              dangerouslySetInnerHTML={{ __html: body }}
            />
          )}

          {cta && (
            <div className="mt-6">
              <CtaButton cta={cta} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
