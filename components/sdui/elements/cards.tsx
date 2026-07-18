/**
 * Shared card renderers — extracted from the removed ContentGrid block so
 * ArticleList (and any future grid block) reuses the same visual variants.
 *
 * Each variant consumes a CardElement: image, title, description, url, tag.
 * Styles: default | compact | featured | horizontal (CARD_COMPONENTS map).
 */

import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import type { CardStyle } from "@/types/blocks";
import type { CardElement } from "@/types/elements";
import { mediaUrl, mediaAlt } from "@/lib/media";

/** Wrapper de tarjeta clickeable: hover + anillo de foco visible (a11y). */
const cardLinkClass =
  "block h-full transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-foues-accent)]";

/** Chip de etiqueta sobre fondo claro (reemplaza el badge de Skeleton). */
const tagChipClass =
  "self-start rounded-full px-2 py-0.5 text-xs font-semibold text-[var(--color-foues-accent)]";
const tagChipStyle = {
  backgroundColor: "color-mix(in srgb, var(--color-foues-accent) 14%, transparent)",
} as const;

// ---------------------------------------------------------------------------
// Card style variants
// ---------------------------------------------------------------------------

export function CardDefault({ item }: { item: CardElement }) {
  const imgUrl = mediaUrl(item.image);
  const imgAlt = mediaAlt(item.image, item.title);

  const inner = (
    <div className="bg-[var(--color-foues-surface-raised)] shadow-md overflow-hidden flex flex-col h-full">
      {imgUrl ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden shrink-0">
          <Image src={imgUrl} alt={imgAlt} fill className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
        </div>
      ) : (
        <div className="aspect-[16/10] w-full shrink-0 bg-[var(--color-foues-surface-sunken)]" aria-hidden="true" />
      )}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {item.tag && (
          <div className="flex items-center gap-2 text-[var(--color-foues-text-muted)]">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold">{item.tag}</span>
          </div>
        )}
        <h3 className="font-bold text-base leading-snug text-[var(--color-foues-text-base)]">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-[var(--color-foues-text-secondary)] line-clamp-3 flex-1">{item.description}</p>
        )}
        {item.url && (
          <div className="mt-2 flex items-center gap-1">
            <span className="text-sm font-bold uppercase" style={{ color: "var(--color-foues-red)" }}>LEER MÁS</span>
            <ArrowRight className="h-4 w-4" style={{ color: "var(--color-foues-red)" }} aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );

  return item.url ? (
    <Link href={item.url} className={cardLinkClass}>
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

export function CardCompact({ item }: { item: CardElement }) {
  const inner = (
    <div className="flex h-full flex-col gap-1 rounded-xl border border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-raised)] p-3 shadow-sm">
      {item.tag && (
        <span className={tagChipClass} style={tagChipStyle}>{item.tag}</span>
      )}
      <h3 className="font-semibold text-sm leading-snug text-[var(--color-foues-text-base)]">{item.title}</h3>
      {item.description && (
        <p className="text-xs text-[var(--color-foues-text-secondary)] line-clamp-2">{item.description}</p>
      )}
    </div>
  );

  return item.url ? (
    <Link href={item.url} className={cardLinkClass}>
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

export function CardFeatured({ item }: { item: CardElement }) {
  const imgUrl = mediaUrl(item.image);
  const imgAlt = mediaAlt(item.image, item.title);

  const inner = (
    <div className="relative flex h-full min-h-64 items-end overflow-hidden rounded-xl border border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-raised)] shadow-sm">
      {imgUrl && (
        <Image src={imgUrl} alt={imgAlt} fill className="object-cover" sizes="(max-width:640px) 100vw, 50vw" />
      )}
      <div className="relative z-10 p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent w-full">
        {item.tag && (
          <span
            className="mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
          >
            {item.tag}
          </span>
        )}
        <h3 className="font-bold text-lg text-white leading-snug">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-white/80 line-clamp-2 mt-1">{item.description}</p>
        )}
      </div>
    </div>
  );

  return item.url ? (
    <Link href={item.url} className={cardLinkClass}>
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

export function CardHorizontal({ item }: { item: CardElement }) {
  const imgUrl = mediaUrl(item.image);
  const imgAlt = mediaAlt(item.image, item.title);

  const inner = (
    <div className="flex h-full flex-row gap-0 overflow-hidden rounded-xl border border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-raised)] shadow-sm">
      {imgUrl && (
        <div className="relative w-32 shrink-0 overflow-hidden">
          <Image src={imgUrl} alt={imgAlt} fill className="object-cover" sizes="128px" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {item.tag && (
          <span className={tagChipClass} style={tagChipStyle}>{item.tag}</span>
        )}
        <h3 className="font-semibold text-sm leading-snug text-[var(--color-foues-text-base)]">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-[var(--color-foues-text-secondary)] line-clamp-3">{item.description}</p>
        )}
      </div>
    </div>
  );

  return item.url ? (
    <Link href={item.url} className={cardLinkClass}>
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

/** card_style → variant component (O(1) lookup, unknown falls back to default). */
export const CARD_COMPONENTS: Record<CardStyle, ({ item }: { item: CardElement }) => React.JSX.Element> = {
  default: CardDefault,
  compact: CardCompact,
  featured: CardFeatured,
  horizontal: CardHorizontal,
};
