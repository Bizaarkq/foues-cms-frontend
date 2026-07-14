import Image from "next/image";
import Link from "next/link";
import type { HeroLandingProps } from "@/types/blocks";
import { mediaUrl, mediaAlt } from "@/lib/media";

export default function HeroLanding({ title, subtitle, backgroundImage, buttons }: HeroLandingProps) {
  const imgUrl = mediaUrl(backgroundImage);
  const imgAlt = mediaAlt(backgroundImage, title ?? "Hero");

  return (
    <section
      className="relative isolate flex h-[420px] w-full items-center overflow-hidden md:h-[600px]"
      style={{ backgroundColor: "var(--color-foues-navy)" }}
    >
      {imgUrl && (
        <Image
          src={imgUrl}
          alt={imgAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ zIndex: -20 }}
        />
      )}

      {/* Gradiente horizontal izquierda→derecha, derivado del token navy
          para que siga a la paleta editable (y al dark mode) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, color-mix(in srgb, var(--color-foues-navy) 95%, transparent), color-mix(in srgb, var(--color-foues-navy) 70%, transparent))",
          zIndex: -10,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative max-w-[1920px] mx-auto px-6">
        <div className="max-w-2xl text-white">
          {title && (
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl">{title}</h1>
          )}

          {subtitle && (
            <p className="mt-6 text-lg text-white/90 sm:text-xl">{subtitle}</p>
          )}

          {buttons.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-4">
              {buttons.map((btn, i) => {
                const isFilled = btn.variant.includes("filled");
                const focusRing =
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";
                const classes = isFilled
                  ? `inline-flex h-[60px] items-center rounded-lg px-8 text-base font-bold text-white transition hover:opacity-90 ${focusRing}`
                  : `inline-flex h-[60px] items-center rounded-lg px-8 text-base font-bold transition hover:opacity-90 ${focusRing}`;
                const style = isFilled
                  ? { backgroundColor: "var(--color-foues-accent)" }
                  : { backgroundColor: "white", color: "var(--color-foues-navy)" };

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
        </div>
      </div>
    </section>
  );
}
