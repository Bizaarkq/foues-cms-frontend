import type { CSSProperties } from "react";
import Image from "next/image";
import type { HeroPageProps, GradientOption } from "@/types/blocks";
import { mediaUrl, mediaAlt } from "@/lib/media";

export default function HeroPage({ title, subtitle, backgroundImage, gradient }: HeroPageProps) {
  const imgUrl = mediaUrl(backgroundImage);
  const imgAlt = mediaAlt(backgroundImage, title ?? "Hero");

  // REQ-HP-02: null is treated identically to "none" — no overlay gradient.
  const effectiveGradient: GradientOption = gradient ?? "none";

  const overlayStyle: CSSProperties | undefined =
    effectiveGradient === "primary"
      ? {
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--color-foues-navy) 75%, transparent), transparent 60%)",
        }
      : effectiveGradient === "secondary"
      ? {
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--color-foues-accent) 75%, transparent), transparent 60%)",
        }
      : undefined;

  return (
    <section className="relative w-full h-[400px] md:h-[520px] overflow-hidden">
      {imgUrl ? (
        <Image
          src={imgUrl}
          alt={imgAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      ) : (
        <div className="absolute inset-0" style={{ backgroundColor: "var(--color-foues-navy)" }} />
      )}

      {/* Overlay: always rendered when title/subtitle present so text is positioned bottom-left.
          Background gradient applied only when effectiveGradient is not "none". */}
      {(title || subtitle) && (
        <div
          className="absolute inset-0 flex items-end"
          style={overlayStyle}
        >
          <div className="max-w-[1920px] mx-auto px-6 pb-10 w-full">
            {title && (
              <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
            )}
            {subtitle && (
              <p className="mt-2 text-lg text-white/80">{subtitle}</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
