/**
 * MagazineViewer — server component for the per-edition flipbook page.
 *
 * Fetches the issue by slug; calls notFound() if the issue does not exist,
 * is not ready, or is not published. Pre-resolves all page image URLs to
 * absolute before passing them across the server → client boundary to
 * FlipbookClient.
 *
 * Receives navbar/footer from the catch-all route (getPageByPath returns
 * them even when no Strapi route exists for the magazine path).
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getMagazineIssueBySlug } from "@/lib/strapi";
import { env } from "@/lib/env";
import type { NavbarData, FooterData } from "@/types/page";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import { FlipbookClient } from "./FlipbookClient";

// ---------------------------------------------------------------------------
// Inline URL resolver — keeps this component free of a mediaUrl() import that
// would drag in lib/media (and therefore lib/env) via the shared module graph.
// lib/env is already imported above for env.strapi.url.
// ---------------------------------------------------------------------------

function resolveUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${env.strapi.publicUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MagazineViewerProps {
  slug: string;
  /** Path of the page holding the archive block — target of the back link. */
  backHref: string;
  /**
   * Publications selected on the parent page's archive block(s).
   * null = all publications allowed. An issue outside this set 404s.
   */
  allowedPublicationIds: string[] | null;
  navbar: NavbarData;
  footer: FooterData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function MagazineViewer({
  slug,
  backHref,
  allowedPublicationIds,
  navbar,
  footer,
}: MagazineViewerProps) {
  const issue = await getMagazineIssueBySlug(slug);

  // Guard: issue not found, not ready, or not published
  if (!issue || issue.conversionStatus !== "ready" || !issue.publishedAt) {
    notFound();
  }

  // Guard: the issue must belong to a publication selected on the parent
  // page's archive block(s); null = all publications allowed.
  if (
    allowedPublicationIds !== null &&
    (!issue.publication ||
      !allowedPublicationIds.includes(issue.publication.documentId))
  ) {
    notFound();
  }

  const pdfUrl = issue.pdf?.url ? resolveUrl(issue.pdf.url) : null;

  const resolvedPages = issue.pages.map((p) => ({
    url: resolveUrl(p.url),
    width: p.width,
    height: p.height,
  }));

  const formattedDate = issue.date
    ? new Date(issue.date).toLocaleDateString("es-SV", {
        year: "numeric",
        month: "long",
      })
    : null;

  return (
    <DefaultLayout navbar={navbar} footer={footer}>
      <div className="w-full max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] rounded"
          style={{ color: "var(--color-foues-text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Todas las ediciones
        </Link>

        {/* Issue header */}
        <header className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {issue.number !== null && (
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-1"
                style={{ color: "var(--color-foues-text-muted)" }}
              >
                Edición {issue.number}
              </p>
            )}
            <h1
              className="text-2xl font-bold leading-tight sm:text-3xl"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {issue.title}
            </h1>
            {formattedDate && (
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--color-foues-text-secondary)" }}
              >
                {formattedDate}
              </p>
            )}
            {issue.description && (
              <p
                className="mt-2 text-sm leading-relaxed"
                style={{ color: "var(--color-foues-text-body)" }}
              >
                {issue.description}
              </p>
            )}
          </div>

          {pdfUrl && (
            <a
              href={pdfUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 shrink-0 self-start px-4 py-2 text-sm font-semibold rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] transition-opacity hover:opacity-80"
              style={{
                background: "var(--color-foues-accent)",
                color: "#fff",
              }}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar PDF
            </a>
          )}
        </header>

        {/* Divider */}
        <div
          className="mb-4 h-px w-full"
          style={{ background: "var(--color-foues-border-subtle)" }}
          aria-hidden="true"
        />

        {/* Flipbook */}
        <FlipbookClient documentId={issue.documentId} pages={resolvedPages} />
      </div>
    </DefaultLayout>
  );
}
