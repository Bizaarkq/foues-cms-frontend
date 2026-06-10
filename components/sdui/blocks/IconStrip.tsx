import Link from "next/link";
import type { IconStripProps } from "@/types/blocks";
import type { QuickLinkItem } from "@/types/elements";
import { LucideIcon } from "@/components/ui/LucideIcon";

export default function IconStrip({ title, links }: IconStripProps) {
  if (!links?.length) return null;
  return (
    <section className="w-full py-10">
      <div className="max-w-[1920px] mx-auto px-6">
        {title ? (
          <div className="mb-8">
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
        ) : null}
        <ul className="flex flex-wrap items-start justify-center gap-x-8 gap-y-6">
          {links.map((item, i) => (
            <IconStripItem key={`${item.label}-${i}`} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function IconStripItem({ item }: { item: QuickLinkItem }) {
  const content = (
    <div className="flex flex-col items-center text-center w-24">
      <LucideIcon
        name={item.icon}
        size={32}
        className="mb-2"
        style={{ color: "var(--color-foues-navy)" }}
        aria-hidden="true"
      />
      <span className="text-sm leading-tight" style={{ color: "var(--color-foues-navy)" }}>
        {item.label}
      </span>
    </div>
  );

  if (!item.url) return <li>{content}</li>;

  return (
    <li>
      <Link
        href={item.url}
        className="hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-foues-input-focus-ring)]"
      >
        {content}
      </Link>
    </li>
  );
}
