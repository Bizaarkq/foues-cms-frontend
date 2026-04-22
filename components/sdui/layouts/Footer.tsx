import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import type {
  FooterData,
  FooterColumn,
  FooterColumnInstitution,
  FooterColumnLinks,
  FooterColumnContact,
  FooterColumnText,
} from "@/types/page";
import { mediaUrl } from "@/lib/media";

function ColInstitution({ col }: { col: FooterColumnInstitution }) {
  const logoUrl = col.logo ? mediaUrl(col.logo) : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
        ) : (
          <div
            className="flex h-16 w-12 shrink-0 items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            UES
          </div>
        )}
        {(col.institution_name || col.sub_name) && (
          <div className="flex flex-col">
            {col.institution_name && (
              <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                {col.institution_name}
              </span>
            )}
            {col.sub_name && (
              <span className="text-lg font-bold text-white">{col.sub_name}</span>
            )}
          </div>
        )}
      </div>
      {col.description && (
        <p className="text-sm leading-relaxed text-white/80">{col.description}</p>
      )}
      {col.social_links.length > 0 && (
        <div className="flex gap-3">
          {col.social_links.map((link, i) => (
            <a
              key={i}
              href={link.url ?? "#"}
              className="flex h-10 w-10 items-center justify-center bg-white/10 text-white transition hover:bg-white/20"
              aria-label={link.label}
            >
              <span className="text-xs font-bold">{link.label.slice(0, 2).toUpperCase()}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ColLinks({ col }: { col: FooterColumnLinks }) {
  return (
    <div className="flex flex-col gap-6">
      {col.heading && (
        <h3 className="text-lg font-bold text-white">{col.heading}</h3>
      )}
      {col.links.length > 0 && (
        <ul className="flex flex-col gap-3">
          {col.links.map((link, i) => (
            <li key={i}>
              {link.url ? (
                <Link
                  href={link.url}
                  className="text-sm font-semibold text-white/80 transition hover:text-white"
                >
                  • {link.label}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-white/80">• {link.label}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ColContact({ col }: { col: FooterColumnContact }) {
  return (
    <div className="flex flex-col gap-6">
      {col.heading && (
        <h3 className="text-lg font-bold text-white">{col.heading}</h3>
      )}
      <div className="flex flex-col gap-4">
        {col.address && (
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
            <p className="text-sm text-white/80">{col.address}</p>
          </div>
        )}
        {col.phone && (
          <div className="flex gap-3">
            <Phone className="h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
            <p className="text-sm text-white/80">{col.phone}</p>
          </div>
        )}
        {col.email && (
          <div className="flex gap-3">
            <Mail className="h-5 w-5 shrink-0 text-white/70" aria-hidden="true" />
            <p className="text-sm text-white/80">{col.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ColText({ col }: { col: FooterColumnText }) {
  return (
    <div className="flex flex-col gap-4">
      {col.heading && (
        <h3 className="text-lg font-bold text-white">{col.heading}</h3>
      )}
      {col.body && (
        <p className="text-sm leading-relaxed text-white/80">{col.body}</p>
      )}
    </div>
  );
}

function FooterColumnRenderer({ col }: { col: FooterColumn }) {
  switch (col.__component) {
    case "footer.column-institution":
      return <ColInstitution col={col} />;
    case "footer.column-links":
      return <ColLinks col={col} />;
    case "footer.column-contact":
      return <ColContact col={col} />;
    case "footer.column-text":
      return <ColText col={col} />;
  }
}

interface FooterProps {
  footer: FooterData;
}

export function Footer({ footer }: FooterProps) {
  const hasCols = footer.columns.length > 0;
  const hasBottom = footer.copyright || footer.bottom_links.length > 0;

  return (
    <footer className="w-full pt-16" style={{ backgroundColor: "var(--color-foues-navy)" }}>
      {hasCols && (
        <div className="max-w-[1920px] mx-auto px-6 pb-12">
          <div
            className="grid gap-10"
            style={{ gridTemplateColumns: `repeat(${footer.columns.length}, minmax(0, 1fr))` }}
          >
            {footer.columns.map((col, i) => (
              <FooterColumnRenderer key={i} col={col} />
            ))}
          </div>
        </div>
      )}

      {hasBottom && (
        <div className="border-t border-white/20">
          <div className="flex max-w-[1920px] mx-auto flex-wrap items-center justify-between gap-4 px-6 py-5">
            {footer.copyright && (
              <p className="text-sm text-white/60">{footer.copyright}</p>
            )}
            {footer.bottom_links.length > 0 && (
              <div className="flex gap-6">
                {footer.bottom_links.map((link, i) =>
                  link.url ? (
                    <Link
                      key={i}
                      href={link.url}
                      className="text-sm font-semibold text-white/60 transition hover:text-white/90"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <span key={i} className="text-sm font-semibold text-white/60">
                      {link.label}
                    </span>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
