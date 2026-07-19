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

// ---------------------------------------------------------------------------
// Document repository
// ---------------------------------------------------------------------------

/** Document category — defines the read-role gate for its documents. */
export interface DocumentCategory {
  documentId: string;
  name: string;
  slug: string;
  description: string | null;
  /**
   * Normalised role keys (mapped from the allowed_roles relation at the
   * lib/strapi.ts boundary, mapAllowedRoles pattern). Empty = any
   * logged-in user may read.
   */
  allowedRoles: string[];
}

/** File metadata for a document — deliberately NOT the full StrapiMedia
 * shape: the repository never exposes the raw Strapi upload URL to the
 * client, only what the download proxy needs to render the link. */
export interface RepoDocumentFile {
  url: string;
  name: string;
  mime: string;
  size: number | null;
}

/** Document (repository item) collection item. */
export interface RepoDocument {
  documentId: string;
  title: string;
  file: RepoDocumentFile | null;
  categoryId: string;
  publishedAt: string | null;
}
