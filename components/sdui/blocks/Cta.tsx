import Link from "next/link";
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
          {buttons.map((btn, i) => {
            const isPrimary = btn.variant.includes("primary");
            const isFilled = btn.variant.includes("filled");
            // Tokens reales: navy (primario) / accent (secundario) — los
            // antiguos --color-foues-primary/secondary no existen en globals
            // y dejaban los botones sin color.
            const brand = isPrimary ? "var(--color-foues-navy)" : "var(--color-foues-accent)";
            const classes =
              "inline-flex items-center px-8 py-3 rounded-full text-sm font-bold tracking-widest uppercase transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foues-accent)]";
            const style = isFilled
              ? { backgroundColor: brand, color: "white" }
              : { border: `2px solid ${brand}`, color: brand };

            if (!btn.url) {
              return (
                <span key={i} className={`${classes} cursor-not-allowed opacity-60`} style={style}>
                  {btn.label}
                </span>
              );
            }
            return (
              <Link key={i} href={btn.url} className={classes} style={style}>
                {btn.label}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
