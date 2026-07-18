/**
 * PaginationNav — path-based pagination for self-fetching list blocks.
 *
 * Page 1 is the page's own path; page n > 1 is the virtual child
 * `${basePath}/pagina/${n}` (resolved by the catch-all). Renders nothing
 * when there is a single page.
 */

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationNavProps {
  /** Path of the page holding the block ("" or "/" for the home page). */
  basePath: string;
  currentPage: number;
  pageCount: number;
}

const pageLinkClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded px-2 text-sm font-semibold transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)]";

export function PaginationNav({ basePath, currentPage, pageCount }: PaginationNavProps) {
  if (pageCount <= 1) return null;

  // "/" would produce "//pagina/n"; normalise the home path to "".
  const base = basePath === "/" ? "" : basePath;
  const hrefFor = (n: number) => (n === 1 ? base || "/" : `${base}/pagina/${n}`);

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginación de artículos" className="mt-10 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Link
          href={hrefFor(currentPage - 1)}
          className={pageLinkClass}
          style={{ color: "var(--color-foues-text-secondary)" }}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </Link>
      )}

      {pages.map((n) =>
        n === currentPage ? (
          <span
            key={n}
            aria-current="page"
            className="inline-flex h-9 min-w-9 items-center justify-center rounded px-2 text-sm font-bold text-white"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={hrefFor(n)}
            className={pageLinkClass}
            style={{ color: "var(--color-foues-text-secondary)" }}
            aria-label={`Ir a la página ${n}`}
          >
            {n}
          </Link>
        )
      )}

      {currentPage < pageCount && (
        <Link
          href={hrefFor(currentPage + 1)}
          className={pageLinkClass}
          style={{ color: "var(--color-foues-text-secondary)" }}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
