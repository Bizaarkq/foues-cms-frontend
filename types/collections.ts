/**
 * Strapi collection types (articles, etc.).
 * Article shape consumed by the article-list block and /articulos/[slug].
 */

import type { StrapiMedia } from "./strapi";

/** Article category enum (hyphen-free values — Strapi GraphQL enum gotcha). */
export type ArticleCategory = "news" | "event";

/** Article (news/event) collection item. */
export interface Article {
  documentId: string;
  Title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  image: StrapiMedia | null;
  category: ArticleCategory;
  /** ISO datetime; meaningful only when category = "event". */
  event_date: string | null;
  publishedAt: string | null;
  /** Selected only by the by-slug query (JSON-LD dateModified). */
  updatedAt?: string | null;
}
