"use client";

import Image from "next/image";
import { Carousel } from "@skeletonlabs/skeleton-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

/** Slide with its image URL already resolved server-side (CarouselBlock). */
export interface ResolvedSlide {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
  title: string | null;
  text: string | null;
  link: string | null;
}

interface CarouselClientProps {
  title: string | null;
  slides: ResolvedSlide[];
  autoplay: boolean;
}

// Spanish (es-SV) aria labels for the Zag.js carousel machine.
const TRANSLATIONS = {
  nextTrigger: "Siguiente diapositiva",
  prevTrigger: "Diapositiva anterior",
  indicator: (index: number) => `Ir a la diapositiva ${index + 1}`,
  item: (index: number, count: number) => `Diapositiva ${index + 1} de ${count}`,
  autoplayStart: "Iniciar reproducción automática",
  autoplayStop: "Pausar reproducción automática",
};

const TRIGGER_CLASSES =
  "flex h-10 w-10 items-center justify-center rounded-full border transition-colors " +
  "bg-[var(--color-foues-surface-raised)] border-[var(--color-foues-border-subtle)] " +
  "hover:bg-[var(--color-foues-surface-sunken)] disabled:opacity-40";

/** Image + optional caption overlay shared by the static and sliding paths. */
function SlideFigure({ slide }: { slide: ResolvedSlide }) {
  const figure = (
    <figure className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--color-foues-surface-sunken)]">
      <Image
        src={slide.url}
        alt={slide.alt}
        fill
        sizes="(min-width: 1024px) 960px, 100vw"
        className="object-cover"
      />
      {(slide.title || slide.text) && (
        <figcaption
          className="absolute inset-x-0 bottom-0 px-6 pb-5 pt-16 text-white"
          style={{
            background:
              "linear-gradient(to top, var(--color-foues-hero-overlay), transparent)",
          }}
        >
          {slide.title && (
            <p className="text-lg font-bold sm:text-xl">{slide.title}</p>
          )}
          {slide.text && (
            <p className="mt-1 text-sm sm:text-base">{slide.text}</p>
          )}
        </figcaption>
      )}
    </figure>
  );

  if (!slide.link) return figure;
  return (
    <a href={slide.link} className="block" aria-label={slide.title ?? slide.alt}>
      {figure}
    </a>
  );
}

/**
 * CarouselClient — curated wrapper around Skeleton (Zag.js) Carousel.
 * One slide → static figure, no controls. Autoplay is the only behavior
 * flag exposed from the CMS; visitors can always pause it.
 */
export default function CarouselClient({ title, slides, autoplay }: CarouselClientProps) {
  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface)]">
      <div className="mx-auto max-w-[1920px] px-6">
        {title && (
          <div className="mb-10">
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

        {slides.length === 1 ? (
          // Single slide: static render, no carousel machinery.
          <SlideFigure slide={slides[0]} />
        ) : (
          <Carousel
            slideCount={slides.length}
            autoplay={autoplay}
            loop
            spacing="16px"
            translations={TRANSLATIONS}
          >
            <Carousel.ItemGroup>
              {slides.map((slide, i) => (
                <Carousel.Item key={i} index={i}>
                  <SlideFigure slide={slide} />
                </Carousel.Item>
              ))}
            </Carousel.ItemGroup>

            <Carousel.Context>
              {(carousel) => (
                <Carousel.Control className="mt-4 flex items-center justify-center gap-3">
                  <Carousel.PrevTrigger className={TRIGGER_CLASSES}>
                    <ChevronLeft
                      className="h-5 w-5"
                      style={{ color: "var(--color-foues-navy)" }}
                      aria-hidden="true"
                    />
                  </Carousel.PrevTrigger>

                  <Carousel.IndicatorGroup className="flex items-center gap-2">
                    {slides.map((_, i) => (
                      <Carousel.Indicator
                        key={i}
                        index={i}
                        className="h-2.5 w-2.5 rounded-full transition-colors bg-[var(--color-foues-border-subtle)] data-[current]:bg-[var(--color-foues-accent)]"
                      />
                    ))}
                  </Carousel.IndicatorGroup>

                  <Carousel.NextTrigger className={TRIGGER_CLASSES}>
                    <ChevronRight
                      className="h-5 w-5"
                      style={{ color: "var(--color-foues-navy)" }}
                      aria-hidden="true"
                    />
                  </Carousel.NextTrigger>

                  {autoplay && (
                    <Carousel.AutoplayTrigger className={TRIGGER_CLASSES}>
                      {carousel.isPlaying ? (
                        <Pause
                          className="h-4 w-4"
                          style={{ color: "var(--color-foues-navy)" }}
                          aria-hidden="true"
                        />
                      ) : (
                        <Play
                          className="h-4 w-4"
                          style={{ color: "var(--color-foues-navy)" }}
                          aria-hidden="true"
                        />
                      )}
                    </Carousel.AutoplayTrigger>
                  )}
                </Carousel.Control>
              )}
            </Carousel.Context>
          </Carousel>
        )}
      </div>
    </section>
  );
}
