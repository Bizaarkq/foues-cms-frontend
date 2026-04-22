import Image from "next/image";
import type { HeroPageProps } from "@/types/blocks";
import { mediaUrl, mediaAlt } from "@/lib/media";

export default function HeroPage({ title, subtitle, backgroundImage }: HeroPageProps) {
  const imgUrl = mediaUrl(backgroundImage);
  const imgAlt = mediaAlt(backgroundImage, title ?? "Hero");

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

      {(title || subtitle) && (
        <div
          className="absolute inset-0 flex items-end"
          style={{ background: "linear-gradient(to top, rgba(4,33,84,0.75), transparent 60%)" }}
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
