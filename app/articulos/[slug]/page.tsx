/**
 * Article detail — fixed route /articulos/{slug} (segment in Spanish, es-SV site).
 *
 * Public by design: articles are the faculty's official information channel,
 * so no visibility/role gate applies (unlike CMS-driven routes). This static
 * segment takes precedence over the [[...slug]] catch-all, making "articulos"
 * a reserved path segment (a CMS route with that path would be shadowed).
 *
 * `params` is a Promise in Next.js 16 — must be awaited (page.md file convention).
 * Navbar/footer come from getPageByPath("/") — the unified query returns them
 * even when the route itself is irrelevant, reusing the home cache entry.
 */

import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { getArticleBySlug, getPageByPath } from "@/lib/strapi";
import { mediaUrl, mediaAlt } from "@/lib/media";
import {
  absoluteUrl,
  jsonLdScriptProps,
  stripMarkdown,
  truncateDescription,
} from "@/lib/seo";
import { env } from "@/lib/env";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import MarkdownContent from "@/components/sdui/MarkdownContent";
import type { Article } from "@/types/collections";

// POST fetches are not memoized by Next (only GET), so dedupe the
// generateMetadata + page render calls with React cache().
const getArticle = cache((slug: string) => getArticleBySlug(slug));

const CATEGORY_LABELS: Record<Article["category"], string> = {
  news: "Noticia",
  event: "Evento",
};

/** Fecha es-SV: la del evento cuando aplica, si no la de publicación. */
function formatDate(article: Article): string | null {
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

/** Meta description: CMS excerpt, else the article body stripped of markdown. */
function articleDescription(article: Article): string | undefined {
  if (article.excerpt) return article.excerpt;
  if (article.content) return truncateDescription(stripMarkdown(article.content));
  return undefined;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticle(slug);
  if (!article) return {};

  const description = articleDescription(article);
  const canonical = absoluteUrl(`/articulos/${slug}`);
  const imgUrl = mediaUrl(article.image);

  return {
    title: article.Title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: article.Title,
      description,
      url: canonical,
      publishedTime: article.publishedAt ?? undefined,
      images: imgUrl
        ? [
            {
              url: imgUrl,
              alt: mediaAlt(article.image, article.Title),
              ...(article.image?.width != null ? { width: article.image.width } : {}),
              ...(article.image?.height != null ? { height: article.image.height } : {}),
            },
          ]
        : undefined,
    },
  };
}

export default async function ArticlePage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  const [article, chrome] = await Promise.all([
    getArticle(slug),
    getPageByPath("/"),
  ]);

  // Missing slug or unpublished article (the query only returns published).
  if (!article || !chrome) notFound();

  const imgUrl = mediaUrl(article.image);
  const imgAlt = mediaAlt(article.image, article.Title);
  const formattedDate = formatDate(article);

  const articleUrl = absoluteUrl(`/articulos/${slug}`);
  const description = articleDescription(article);
  const newsArticleJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.Title,
    ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    ...(description ? { description } : {}),
    ...(imgUrl ? { image: [imgUrl] } : {}),
    mainEntityOfPage: articleUrl,
    publisher: {
      "@type": "EducationalOrganization",
      name: "Facultad de Odontología — Universidad de El Salvador",
      url: env.siteUrl,
    },
  };

  return (
    <DefaultLayout navbar={chrome.navbar} footer={chrome.footer}>
      <script {...jsonLdScriptProps(newsArticleJsonLd)} />
      <article className="w-full max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] rounded"
          style={{ color: "var(--color-foues-text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Link>

        {/* Header */}
        <header className="mb-6">
          <span
            className="inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
          >
            {CATEGORY_LABELS[article.category] ?? CATEGORY_LABELS.news}
          </span>
          <h1
            className="mt-3 text-3xl font-bold leading-tight sm:text-4xl"
            style={{ color: "var(--color-foues-navy)" }}
          >
            {article.Title}
          </h1>
          {formattedDate && (
            <p
              className="mt-2 flex items-center gap-2 text-sm"
              style={{ color: "var(--color-foues-text-secondary)" }}
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {formattedDate}
            </p>
          )}
          {article.excerpt && (
            <p
              className="mt-3 text-base leading-relaxed"
              style={{ color: "var(--color-foues-text-body)" }}
            >
              {article.excerpt}
            </p>
          )}
        </header>

        {/* Hero image */}
        {imgUrl && (
          <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-xl">
            <Image
              src={imgUrl}
              alt={imgAlt}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 896px) 100vw, 896px"
            />
          </div>
        )}

        {/* Body */}
        {article.content && (
          <MarkdownContent
            content={article.content}
            className="prose prose-lg max-w-none pb-12"
          />
        )}
      </article>
    </DefaultLayout>
  );
}
