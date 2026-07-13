import type { TimelineProps } from "@/types/blocks";
import type { TimelineItemElement } from "@/types/elements";

function ItemContent({ item }: { item: TimelineItemElement }) {
  return (
    <>
      <p
        className="text-sm font-semibold leading-snug"
        style={{ color: "var(--color-foues-navy)" }}
      >
        {item.title}
      </p>
      {item.description && (
        <p className="mt-1 text-xs text-[var(--color-foues-text-muted)] leading-relaxed">
          {item.description}
        </p>
      )}
    </>
  );
}

function MobileTimeline({ items }: { items: TimelineItemElement[] }) {
  return (
    <ol className="flex flex-col md:hidden">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className="relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full ring-2 ring-white"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
            {i < items.length - 1 && (
              <div
                className="mt-1 w-px flex-1"
                style={{
                  backgroundColor: "var(--color-foues-accent)",
                  opacity: 0.35,
                  minHeight: "2rem",
                }}
                aria-hidden="true"
              />
            )}
          </div>

          <div className="pb-8">
            <span
              className="block text-sm font-bold"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {item.year}
            </span>
            <div className="mt-1">
              <ItemContent item={item} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DesktopTimeline({ items }: { items: TimelineItemElement[] }) {
  return (
    <div className="hidden md:block overflow-x-auto pb-4">
      <div className="relative min-w-max">
        {/* Connecting line */}
        <div
          className="absolute left-0 right-0 h-px"
          style={{
            top: "calc(1.5rem + 0.5rem)",
            backgroundColor: "var(--color-foues-accent)",
            opacity: 0.35,
          }}
          aria-hidden="true"
        />

        <ol className="flex">
          {items.map((item, i) => (
          <li key={i} className="flex flex-col items-center px-8 min-w-[180px] max-w-[240px]">
            {/* Year label */}
            <span
              className="text-sm font-bold mb-3"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {item.year}
            </span>

            {/* Dot */}
            <div
              className="relative z-10 w-4 h-4 rounded-full ring-2 ring-white shrink-0"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />

              <div className="mt-4 text-center">
                <ItemContent item={item} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function Timeline({ title, items }: TimelineProps) {
  if (items.length === 0) return null;

  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface)]">
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-12">
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

        <DesktopTimeline items={items} />
        <MobileTimeline items={items} />
      </div>
    </section>
  );
}
