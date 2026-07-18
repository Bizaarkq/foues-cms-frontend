/**
 * ArticleList — self-fetching async RSC block (magazine-archive pattern).
 *
 * Fetches published articles (newest first, optional category filter) and
 * renders them with the shared card variants. Pagination is path-based:
 * page n > 1 lives at the virtual child `${pagePath}/pagina/${n}` resolved
 * by the catch-all, so every page is its own ISR entry (no searchParams).
 * Detail links always point at the fixed route `/articulos/{slug}`.
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Newspaper } from "lucide-react";
import type { CSSProperties } from "react";
import { getArticles } from "@/lib/strapi";
import { EmptyState } from "@/components/sdui/EmptyState";
import { CARD_COMPONENTS, CardDefault } from "@/components/sdui/elements/cards";
import { PaginationNav } from "@/components/sdui/elements/PaginationNav";
import type { ArticleListProps } from "@/types/blocks";
import type { Article } from "@/types/collections";
import type { CardElement } from "@/types/elements";

/** Fecha es-SV para el chip de la tarjeta (event_date si es evento, si no publishedAt). */
function formatCardDate(article: Article): string | null {
  const iso =
    article.category === "event" && article.event_date
      ? article.event_date
      : article.publishedAt;
  if (!iso) return null;
  return new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function toCard(article: Article): CardElement {
  return {
    title: article.Title,
    description: article.excerpt,
    image: article.image,
    url: article.slug ? `/articulos/${article.slug}` : null,
    tag: formatCardDate(article),
    customClasses: null,
  };
}

/** Skeleton del grid de tarjetas mientras el RSC async resuelve su fetch. */
function ListSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="overflow-hidden bg-[var(--color-foues-surface-raised)] shadow-md">
          <div className="aspect-[16/10] w-full animate-pulse bg-[var(--color-foues-border-subtle)]" />
          <div className="flex flex-col gap-2 p-5">
            <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ArticleList(props: ArticleListProps) {
  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface-sunken)]">
      <div className="max-w-[1920px] mx-auto px-6">
        {props.title && (
          <div className="mb-10">
            <h2
              className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {props.title}
            </h2>
            <span
              className="mt-2 block h-1 w-16 rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
          </div>
        )}
        <Suspense fallback={<ListSkeleton />}>
          <ArticleGrid {...props} />
        </Suspense>
      </div>
    </section>
  );
}

async function ArticleGrid({
  category_filter,
  page_size,
  card_style,
  columns,
  pagePath,
  pageNumber,
}: ArticleListProps) {
  const page = pageNumber ?? 1;
  const pageSize = Math.min(Math.max(page_size ?? 9, 1), 24);

  const { articles, pagination } = await getArticles({
    category: category_filter ?? "all",
    page,
    pageSize,
  });

  // Virtual /pagina/{n} paths beyond the last page do not exist.
  if (page > 1 && page > pagination.pageCount) {
    notFound();
  }

  if (articles.length === 0) {
    return <EmptyState icon={Newspaper} message="Todavía no hay artículos publicados." />;
  }

  const CardComponent = CARD_COMPONENTS[card_style] ?? CardDefault;

  // Mobile always collapses to 1 column; from md+ the CMS-driven count
  // applies via a CSS variable (Tailwind cannot emit dynamic col counts).
  const colCount = Math.min(Math.max(columns ?? 3, 1), 12);
  const gridStyle = {
    "--article-cols": `repeat(${colCount}, minmax(0, 1fr))`,
  } as CSSProperties;

  return (
    <>
      <div
        className="grid grid-cols-1 gap-6 md:[grid-template-columns:var(--article-cols)]"
        style={gridStyle}
      >
        {articles.map((article) => (
          <CardComponent key={article.documentId} item={toCard(article)} />
        ))}
      </div>
      <PaginationNav
        basePath={pagePath ?? ""}
        currentPage={pagination.page}
        pageCount={pagination.pageCount}
      />
    </>
  );
}
