/**
 * ContentGrid — responsive card grid block.
 *
 * REQ-CG01: Column count driven by `columns` enum via contentGridCols().
 * REQ-CG02: Card style variants: default | compact | featured | horizontal.
 * REQ-CG03: Each item may have image, title, description, url, tag.
 * REQ-CG04: Images rendered via Next.js <Image> with mediaUrl() helper.
 * REQ-CG05: Degrades gracefully when items array is empty.
 */

import Image from "next/image";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import type { ContentGridProps } from "@/types/blocks";
import type { CardElement } from "@/types/elements";
import { mediaUrl, mediaAlt } from "@/lib/media";
import { contentGridCols } from "@/lib/grid-columns";

// ---------------------------------------------------------------------------
// Card style sub-components
// ---------------------------------------------------------------------------

function CardDefault({ item }: { item: CardElement }) {
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
    <Link href={item.url} className="block h-full focus:outline-none">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

function CardCompact({ item }: { item: CardElement }) {
  const inner = (
    <div className="card p-3 flex flex-col gap-1 h-full">
      {item.tag && (
        <span className="badge variant-soft-primary text-xs self-start">{item.tag}</span>
      )}
      <h3 className="font-semibold text-sm leading-snug">{item.title}</h3>
      {item.description && (
        <p className="text-xs text-surface-700 line-clamp-2">{item.description}</p>
      )}
    </div>
  );

  return item.url ? (
    <Link href={item.url} className="block h-full hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

function CardFeatured({ item }: { item: CardElement }) {
  const imgUrl = mediaUrl(item.image);
  const imgAlt = mediaAlt(item.image, item.title);

  const inner = (
    <div className="card overflow-hidden h-full relative min-h-64 flex items-end">
      {imgUrl && (
        <Image src={imgUrl} alt={imgAlt} fill className="object-cover" sizes="(max-width:640px) 100vw, 50vw" />
      )}
      <div className="relative z-10 p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent w-full">
        {item.tag && (
          <span className="badge variant-filled-primary text-xs mb-1">{item.tag}</span>
        )}
        <h3 className="font-bold text-lg text-white leading-snug">{item.title}</h3>
        {item.description && (
          <p className="text-sm text-white/80 line-clamp-2 mt-1">{item.description}</p>
        )}
      </div>
    </div>
  );

  return item.url ? (
    <Link href={item.url} className="block h-full hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

function CardHorizontal({ item }: { item: CardElement }) {
  const imgUrl = mediaUrl(item.image);
  const imgAlt = mediaAlt(item.image, item.title);

  const inner = (
    <div className="card overflow-hidden flex flex-row gap-0 h-full">
      {imgUrl && (
        <div className="relative w-32 shrink-0 overflow-hidden">
          <Image src={imgUrl} alt={imgAlt} fill className="object-cover" sizes="128px" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {item.tag && (
          <span className="badge variant-soft-primary text-xs self-start">{item.tag}</span>
        )}
        <h3 className="font-semibold text-sm leading-snug">{item.title}</h3>
        {item.description && (
          <p className="text-xs text-surface-700 line-clamp-3">{item.description}</p>
        )}
      </div>
    </div>
  );

  return item.url ? (
    <Link href={item.url} className="block h-full hover:opacity-90 transition-opacity">
      {inner}
    </Link>
  ) : (
    <div className="h-full">{inner}</div>
  );
}

// ---------------------------------------------------------------------------
// Main block
// ---------------------------------------------------------------------------

const CARD_COMPONENTS = {
  default: CardDefault,
  compact: CardCompact,
  featured: CardFeatured,
  horizontal: CardHorizontal,
} as const;

export default function ContentGrid({
  title,
  columns,
  card_style,
  items,
}: ContentGridProps) {
  const gridClass = contentGridCols(columns);
  const CardComponent = CARD_COMPONENTS[card_style] ?? CardDefault;

  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface-sunken)]">
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold uppercase tracking-wider sm:text-3xl" style={{ color: "var(--color-foues-navy)" }}>
              {title}
            </h2>
            <span
              className="mt-2 block h-1 w-16 rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
          </div>
        )}
        {items.length === 0 ? (
          <p className="text-center text-[var(--color-foues-text-muted)]">No hay contenido disponible</p>
        ) : (
          <div className={`${gridClass} gap-6`}>
            {items.map((item, i) => (
              <CardComponent key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
