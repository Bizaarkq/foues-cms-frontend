import type { TimelineProps } from "@/types/blocks";

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

        {/* Horizontal scroll wrapper */}
        <div className="overflow-x-auto pb-4">
          <div className="relative flex min-w-max">
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

            {items.map((item, i) => (
              <div key={i} className="flex flex-col items-center px-8 min-w-[180px] max-w-[240px]">
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
                />

                {/* Title + description */}
                <div className="mt-4 text-center">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
