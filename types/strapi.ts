/**
 * Strapi v5 primitive types shared across all content types.
 * REQ-T01: Base Strapi entity shapes.
 */

/** Strapi media object returned by GraphQL (single image). */
export interface StrapiMedia {
  documentId: string;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
  mime: string;
  name: string;
}

/** Strapi rich-text field — stored as markdown string in Strapi v5. */
export type StrapiRichText = string;
