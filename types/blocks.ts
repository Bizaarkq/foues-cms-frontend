/**
 * Block component types for the SDUI Dynamic Zone.
 * REQ-T03: Discriminated union on __component for all 12 blocks.
 *
 * Enum fix: `columns` fields use `col_N` format (NOT numeric strings).
 * GraphQL enum members must match /^[_a-zA-Z][_a-zA-Z0-9]*$/.
 * See engram bugfix: "GraphQL enum members cannot start with digit".
 */

import type { StrapiMedia, StrapiRichText } from "./strapi";
import type {
  ButtonElement,
  CardElement,
  TimelineItemElement,
  StepElement,
  ScheduleItemElement,
  QuickLinkItem,
} from "./elements";

// ---------------------------------------------------------------------------
// Shared enum types
// ---------------------------------------------------------------------------

/** columns enum used in photo-gallery (col_2 | col_3 | col_4). */
export type PhotoGalleryColumns = "col_2" | "col_3" | "col_4";

/** columns enum used in content-grid (col_1 | col_2 | col_3 | col_4). */
export type ContentGridColumns = "col_1" | "col_2" | "col_3" | "col_4";

/** card_style enum for content-grid. */
export type CardStyle = "default" | "compact" | "featured" | "horizontal";

/** collection_type enum for content-grid (nullable — manual items when null). */
export type CollectionType = "news" | "events" | "programs" | "faculty";

// ---------------------------------------------------------------------------
// Block props interfaces (one per block)
// ---------------------------------------------------------------------------

export interface HeroLandingProps {
  title: string | null;
  subtitle: string | null;
  backgroundImage: StrapiMedia | null;
  buttons: ButtonElement[];
}

export interface HeroPageProps {
  title: string | null;
  subtitle: string | null;
  backgroundImage: StrapiMedia | null;
}

export interface ContentGridProps {
  title: string | null;
  collection_type: CollectionType | null;
  card_style: CardStyle;
  columns: ContentGridColumns;
  items: CardElement[];
}

export interface PhotoGalleryProps {
  title: string | null;
  subtitle: string | null;
  images: StrapiMedia[];
  photo_columns: PhotoGalleryColumns;
}

export interface QuickLinksProps {
  title: string | null;
  links: QuickLinkItem[];
}

export interface TimelineProps {
  title: string | null;
  items: TimelineItemElement[];
}

export interface MissionVisionProps {
  mission_title: string;
  mission_text: string;
  vision_title: string;
  vision_text: string;
}

export interface ProcessStepsProps {
  title: string | null;
  steps: StepElement[];
}

export interface RichTextProps {
  content: StrapiRichText;
}

export interface CtaProps {
  title: string | null;
  description: string | null;
  buttons: ButtonElement[];
}

export interface CalendarProps {
  title: string | null;
  items: ScheduleItemElement[];
}

export interface MapProps {
  title: string | null;
  address: string | null;
  embed_url: string;
  latitude: number | null;
  longitude: number | null;
}

// ---------------------------------------------------------------------------
// Discriminated union — REQ-T03
// ---------------------------------------------------------------------------

/**
 * SDUIBlock — discriminated union on __component.
 *
 * Exhaustive over all 12 registered blocks. The trailing catch-all member
 * satisfies REQ-N03: unknown blocks are handled gracefully (BlockRenderer
 * returns null for unrecognised __component values).
 */
export type SDUIBlock =
  | ({ __component: "blocks.hero-landing" } & HeroLandingProps)
  | ({ __component: "blocks.hero-page" } & HeroPageProps)
  | ({ __component: "blocks.content-grid" } & ContentGridProps)
  | ({ __component: "blocks.photo-gallery" } & PhotoGalleryProps)
  | ({ __component: "blocks.quick-links" } & QuickLinksProps)
  | ({ __component: "blocks.timeline" } & TimelineProps)
  | ({ __component: "blocks.mission-vision" } & MissionVisionProps)
  | ({ __component: "blocks.process-steps" } & ProcessStepsProps)
  | ({ __component: "blocks.rich-text" } & RichTextProps)
  | ({ __component: "blocks.cta" } & CtaProps)
  | ({ __component: "blocks.calendar" } & CalendarProps)
  | ({ __component: "blocks.map" } & MapProps)
  | { __component: string }; // forward-compat fallback for unknown blocks
