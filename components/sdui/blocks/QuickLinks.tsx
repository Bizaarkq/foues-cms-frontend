import Link from "next/link";
import type { QuickLinksProps } from "@/types/blocks";
import type { QuickLinkItem } from "@/types/elements";
import { LucideIcon } from "@/components/ui/LucideIcon";

// Literal class strings required by Tailwind v4 JIT.
// 0 = auto-responsive; 1–12 = fixed column count with mobile fallback.
const GRID_CLASS: Record<number, string> = {
  0:  "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  1:  "grid-cols-1",
  2:  "grid-cols-2",
  3:  "grid-cols-1 sm:grid-cols-3",
  4:  "grid-cols-2 lg:grid-cols-4",
  5:  "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  6:  "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  7:  "grid-cols-2 md:grid-cols-4 lg:grid-cols-7",
  8:  "grid-cols-2 md:grid-cols-4 lg:grid-cols-8",
  9:  "grid-cols-3 md:grid-cols-5 lg:grid-cols-9",
  10: "grid-cols-3 md:grid-cols-5 lg:grid-cols-10",
  11: "grid-cols-3 md:grid-cols-6 lg:grid-cols-11",
  12: "grid-cols-3 md:grid-cols-6 lg:grid-cols-12",
};

export default function QuickLinks({ title, ql_columns, links }: QuickLinksProps) {
  const cols = ql_columns ?? 0;
  const gridClass = GRID_CLASS[cols] ?? GRID_CLASS[0];

  return (
    <section className="w-full bg-[var(--color-foues-surface)] py-16">
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-10">
            <h2
              className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {title}
            </h2>
            <span
              className="mt-2 block h-1 w-24"
              style={{ backgroundColor: "var(--color-foues-red)" }}
              aria-hidden="true"
            />
          </div>
        )}

        {links.length > 0 && (
          <div className={`grid gap-6 ${gridClass}`}>
            {links.map((link, i) => (
              <QuickLinkCard key={i} link={link} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function QuickLinkCard({ link, index }: { link: QuickLinkItem; index: number }) {
  const isNavy = index % 2 === 0;
  const bgStyle = isNavy
    ? { backgroundColor: "var(--color-foues-navy)" }
    : { backgroundColor: "var(--color-foues-accent)" };

  const body = (
    <div
      className="flex h-full min-h-[252px] flex-col items-center justify-center gap-4 p-8 text-center shadow-md transition hover:opacity-90"
      style={bgStyle}
    >
      <LucideIcon
        name={link.icon}
        size={64}
        className="text-white"
        aria-hidden="true"
      />
      <h3 className="text-xl font-bold text-white">{link.label}</h3>
      {link.description && (
        <p className="text-sm text-white/90">{link.description}</p>
      )}
    </div>
  );

  if (!link.url) return <div className="h-full">{body}</div>;

  return (
    <Link
      href={link.url}
      className="block h-full focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
    >
      {body}
    </Link>
  );
}
