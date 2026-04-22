import Link from "next/link";
import type { QuickLinksProps } from "@/types/blocks";
import type { QuickLinkItem } from "@/types/elements";
import { iconForQuickLink } from "@/lib/iconForQuickLink";

export default function QuickLinks({ title, links }: QuickLinksProps) {
  return (
    <section className="w-full bg-white py-16">
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
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
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
  const Icon = iconForQuickLink(link.icon ?? link.label);
  const bgStyle = isNavy
    ? { backgroundColor: "var(--color-foues-navy)" }
    : { backgroundColor: "var(--color-foues-accent)" };

  const body = (
    <div
      className="flex h-full min-h-[252px] flex-col items-center justify-center gap-4 p-8 text-center shadow-md transition hover:opacity-90"
      style={bgStyle}
    >
      <Icon className="h-16 w-16 text-white" aria-hidden="true" />
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
