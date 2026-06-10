import Link from "next/link";
import { Check } from "lucide-react";
import type { BulletListProps } from "@/types/blocks";
import type { ButtonElement } from "@/types/elements";

const FILLED_CLASS = "inline-flex h-[52px] items-center px-8 text-base font-bold text-white transition hover:opacity-90";
const GHOST_CLASS = "inline-flex h-[52px] items-center border-2 px-8 text-base font-bold transition hover:opacity-80";

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

export default function BulletList({ title, items, cta }: BulletListProps) {
  return (
    <section className="w-full py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-8">
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

        {items.length > 0 && (
          <ul className="space-y-3 mt-6">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check
                  className="mt-1 h-5 w-5 shrink-0"
                  style={{ color: "var(--color-foues-accent)" }}
                  aria-hidden="true"
                />
                <span
                  className="text-base"
                  style={{ color: "color-mix(in srgb, var(--color-foues-navy) 90%, transparent)" }}
                >
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        )}

        {cta && (
          <div className="mt-8">
            <CtaButton cta={cta} />
          </div>
        )}
      </div>
    </section>
  );
}
