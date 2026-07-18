/**
 * MagazineViewer — server component for the per-edition flipbook page.
 *
 * Fetches the issue by slug; calls notFound() if the issue does not exist,
 * is not ready, or is not published. Pre-resolves all page image URLs to
 * absolute before passing them across the server → client boundary to
 * FlipbookClient.
 *
 * Rendered by the fixed /revista/{slug} route; editions are public (no
 * visibility/role inheritance — the archive block's publication filter only
 * governs what each archive lists). Back navigation returns to wherever the
 * reader came from (BackLink), since any page may hold an archive block.
 */

import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { getCachedMagazineIssue } from "@/lib/cached";
import { env } from "@/lib/env";
import type { NavbarData, FooterData } from "@/types/page";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import { FlipbookClient } from "./FlipbookClient";
import { BackLink } from "./BackLink";

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
  navbar: NavbarData;
  footer: FooterData;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function MagazineViewer({ slug, navbar, footer }: MagazineViewerProps) {
  // Cached wrapper: generateMetadata already fetched this issue in the same
  // request — cache() dedupes the POST (Next only memoizes GET fetches).
  const issue = await getCachedMagazineIssue(slug);

  // Guard: issue not found, not ready, or not published
  if (!issue || issue.conversionStatus !== "ready" || !issue.publishedAt) {
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
        {/* Back navigation — returns to wherever the reader came from */}
        <BackLink fallbackHref="/" label="Volver" />

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
