import type { InfoCardProps } from "@/types/blocks";
import { ButtonLink, kindFromVariant } from "@/components/ui/Button";

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
              <ButtonLink label={cta.label} url={cta.url} kind={kindFromVariant(cta.variant)} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
