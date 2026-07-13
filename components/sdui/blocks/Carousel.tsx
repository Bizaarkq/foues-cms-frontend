import type { CarouselBlockProps } from "@/types/blocks";
import { mediaUrl, mediaAlt } from "@/lib/media";
import CarouselClient, { type ResolvedSlide } from "./CarouselClient";

/**
 * CarouselBlock — RSC entry point for blocks.carousel.
 *
 * Resolves slide image URLs against STRAPI_PUBLIC_URL on the server
 * (lib/env is server-only, so mediaUrl cannot run in the client bundle)
 * and hands plain data to the interactive CarouselClient.
 * Empty state: no valid slides → renders nothing.
 */
export default function CarouselBlock({ title, slides, autoplay }: CarouselBlockProps) {
  const resolved: ResolvedSlide[] = (slides ?? []).flatMap((slide) => {
    const url = mediaUrl(slide.image);
    // Defensive: a slide without a resolvable image renders nothing.
    if (!url) return [];
    return [
      {
        url,
        alt: mediaAlt(slide.image, slide.title ?? ""),
        width: slide.image?.width ?? null,
        height: slide.image?.height ?? null,
        title: slide.title,
        text: slide.text,
        link: slide.link,
      },
    ];
  });

  if (resolved.length === 0) return null;

  return (
    <CarouselClient title={title} slides={resolved} autoplay={autoplay ?? false} />
  );
}
