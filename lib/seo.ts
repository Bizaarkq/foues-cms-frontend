/**
 * SEO helpers — pure functions shared by generateMetadata implementations,
 * app/sitemap.ts and JSON-LD scripts. No fetching here (unit-testable).
 */

import type {
  SDUIBlock,
  SectionProps,
  RichTextProps,
  HeroLandingProps,
  HeroPageProps,
} from "@/types/blocks";
import type { StrapiMedia } from "@/types/strapi";
import { env } from "./env";

/** Hero blocks carry the page's headline imagery/subtitle — mined as fallbacks. */
const HERO_COMPONENTS = ["blocks.hero-landing", "blocks.hero-page"];

type HeroBlock = SDUIBlock & (HeroLandingProps | HeroPageProps);

/**
 * absoluteUrl — joins the canonical site origin (env.siteUrl, no trailing
 * slash) with a path.
 */
export function absoluteUrl(path: string): string {
  return `${env.siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Collects every block matching any of the given __components in a page's
 * content, in document order, including blocks nested inside blocks.section
 * groups (max depth 2 by design).
 */
function findBlocksByComponents(
  blocks: SDUIBlock[],
  components: string[]
): SDUIBlock[] {
  const found: SDUIBlock[] = [];
  for (const block of blocks) {
    if (components.includes(block.__component)) {
      found.push(block);
    } else if (block.__component === "blocks.section") {
      const section = block as unknown as SectionProps;
      for (const group of section.children ?? []) {
        found.push(...findBlocksByComponents(group.blocks, components));
      }
    }
  }
  return found;
}

/**
 * Collects every block of a given __component in a page's content, including
 * those nested inside blocks.section groups (max depth 2 by design).
 * Moved here from app/[[...slug]]/page.tsx so metadata mining can reuse it.
 */
export function findBlocksByComponent<T>(blocks: SDUIBlock[], component: string): T[] {
  return findBlocksByComponents(blocks, [component]) as T[];
}

/**
 * stripMarkdown — reduces a markdown string to plain text: removes code
 * fences/inline code and images, converts links to their text, strips
 * heading/emphasis/blockquote/list markers and collapses whitespace.
 */
export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`\n]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/^#{1,6}\s+/gm, "") // heading markers
    .replace(/^>\s?/gm, "") // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, "") // unordered list markers
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list markers
    .replace(/(\*{1,3}|_{1,3}|~~)([^*_~]+)\1/g, "$2") // emphasis/strikethrough
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * truncateDescription — cuts at a word boundary within `max` characters,
 * appending an ellipsis only when the text was actually truncated.
 */
export function truncateDescription(text: string, max = 160): string {
  const clean = text.trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/**
 * mineDescription — derives a meta description from a page's blocks:
 * first non-empty hero subtitle (hero-landing/hero-page, document order),
 * else the first non-empty blocks.rich-text content stripped of markdown.
 * Returns null when nothing usable exists.
 */
export function mineDescription(blocks: SDUIBlock[]): string | null {
  const subtitle = (findBlocksByComponents(blocks, HERO_COMPONENTS) as HeroBlock[])
    .map((hero) => hero.subtitle)
    .find((s): s is string => s !== null && s.trim() !== "");
  if (subtitle) return truncateDescription(subtitle);

  const richText = findBlocksByComponent<RichTextProps>(blocks, "blocks.rich-text")
    .map((block) => stripMarkdown(block.content))
    .find((text) => text !== "");
  if (richText) return truncateDescription(richText);

  return null;
}

/**
 * firstHeroImage — first hero block background image in document order.
 * Used as the og:image fallback when the page has no seo.ogImage override.
 */
export function firstHeroImage(blocks: SDUIBlock[]): StrapiMedia | null {
  return (
    (findBlocksByComponents(blocks, HERO_COMPONENTS) as HeroBlock[])
      .map((hero) => hero.backgroundImage)
      .find((image) => image !== null) ?? null
  );
}

/**
 * jsonLdScriptProps — props for a `<script type="application/ld+json">` tag.
 * Escapes "<" (unicode-escaped) so payload content can never close the tag early.
 */
export function jsonLdScriptProps(data: object) {
  return {
    type: "application/ld+json",
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(data).replace(/</g, "\\u003c"),
    },
  } as const;
}
