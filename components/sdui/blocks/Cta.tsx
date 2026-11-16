import { ButtonLink, kindFromVariant } from "@/components/ui/Button";
import type { CtaProps } from "@/types/blocks";

export default function Cta({ title, description, buttons }: CtaProps) {
  return (
    <section className="py-10 flex flex-col items-center gap-4 text-center">
      {title && (
        <h2 className="text-2xl font-bold tracking-widest uppercase" style={{ color: "var(--color-foues-navy)" }}>
          {title}
        </h2>
      )}
      {description && (
        <p className="max-w-xl text-base" style={{ color: "var(--color-foues-text-muted)" }}>
          {description}
        </p>
      )}
      {buttons.length > 0 && (
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          {buttons.map((btn, i) => (
            <ButtonLink key={i} label={btn.label} url={btn.url} kind={kindFromVariant(btn.variant)} />
          ))}
        </div>
      )}
    </section>
  );
}
