/**
 * Strapi collection types (articles, etc.).
 * REQ-T05: Collection shapes for content-grid collection_type resolution.
 */

import type { StrapiMedia } from "./strapi";

/** Article (formerly "new") collection item. REQ-A01-A03. */
export interface ArticleItem {
  documentId: string;
  Title: string;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  image: StrapiMedia | null;
  createdAt: string; // ISO datetime string
  publishedAt: string | null;
}
