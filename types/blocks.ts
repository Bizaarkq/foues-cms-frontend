/**
 * Block component types for the SDUI Dynamic Zone.
 * REQ-T03: Discriminated union on __component for all 12 blocks.
 *
 * Enum fix: `columns` fields use `col_N` format (NOT numeric strings).
 * GraphQL enum members must match /^[_a-zA-Z][_a-zA-Z0-9]*$/.
 * See engram bugfix: "GraphQL enum members cannot start with digit".
 */

import type { StrapiMedia, StrapiRichText } from "./strapi";
import type { FormDefinition } from "./forms";
import type {
  ButtonElement,
  CardElement,
  TimelineItemElement,
  StepElement,
  ScheduleItemElement,
  ScheduleEntryElement,
  QuickLinkItem,
  ListItem,
  DateEntry,
  AccordionItemElement,
  TabItemElement,
  SlideElement,
} from "./elements";

// ---------------------------------------------------------------------------
// Shared enum types
// ---------------------------------------------------------------------------

/** Gradient overlay option for HeroPage. */
export type GradientOption = "none" | "primary" | "secondary";

/** Display mode for KeyDates block. */
export type KeyDatesDisplayMode = "calendar" | "list";

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
  gradient: GradientOption | null;
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
  /** 0 = auto-responsive, 1–12 = fixed column count */
  ql_columns: number | null;
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

export interface StaffMemberItem {
  documentId: string;
  nombre: string;
  cargo: string;
  foto: StrapiMedia | null;
  descripcion: string | null;
}

export interface OrganizationalUnitItem {
  documentId: string;
  nombre: string;
  tipo: string;
  miembros: StaffMemberItem[];
}

export interface StaffSectionProps {
  titulo: string | null;
  unidad: OrganizationalUnitItem | null;
}

export interface BulletListProps {
  title: string | null;
  items: ListItem[];
  cta: ButtonElement | null;
}

export interface KeyDatesProps {
  title: string | null;
  display_mode: KeyDatesDisplayMode;
  items: DateEntry[];
}

export interface InfoCardProps {
  title: string | null;
  body: string | null;
  cta: ButtonElement | null;
}

export interface ClinicScheduleProps {
  clinic_name: string;
  hours: ScheduleEntryElement[];
  schedule_text: string | null;
}

export interface IconStripProps {
  title: string | null;
  links: QuickLinkItem[];
}

export interface MapScheduleProps {
  clinic_name: string;
  address: string | null;
  embed_url: string;
  hours: ScheduleEntryElement[];
  schedule_text: string | null;
}

export interface FormBlockProps {
  title: string | null;
  submit_label: string | null;
  form: FormDefinition | null;
}

export interface AccordionBlockProps {
  title: string | null;
  items: AccordionItemElement[];
}

export interface TabsBlockProps {
  title: string | null;
  items: TabItemElement[];
}

export interface CarouselBlockProps {
  title: string | null;
  slides: SlideElement[];
  autoplay: boolean;
}

/**
 * Expected shape of the table-editor custom field JSON payload.
 * `data` travels as the GraphQL JSON scalar, so it arrives untyped —
 * DataTable validates it defensively at render time (decision #4).
 */
export interface TableBlockData {
  headers: string[];
  rows: string[][];
}

export interface TableBlockProps {
  title: string | null;
  description: string | null;
  data: unknown;
}

// ---------------------------------------------------------------------------
// Magazine archive block
// ---------------------------------------------------------------------------

/**
 * MagazineArchiveProps — self-fetching block.
 * `title` and `publications` come from the page query (block fields);
 * the issues themselves are fetched by the component as an async RSC,
 * filtered to the selected publications (none selected = all).
 * `pagePath` is injected by BlockRenderer — edition links resolve to
 * `${pagePath}/${slug}` so the block works wherever it is placed.
 */
export interface PublicationRef {
  documentId: string;
  name: string;
  slug: string;
}

export interface MagazineArchiveProps {
  title?: string | null;
  publications?: PublicationRef[] | null;
  pagePath?: string;
}

// ---------------------------------------------------------------------------
// Nested SDUI types (blocks.section)
// ---------------------------------------------------------------------------

/**
 * The normalized content of a block-group (post-normalizeBlocks).
 * Each group is a named container of flat SDUIBlocks.
 */
export interface BlockGroupContent {
  id: string;         // documentId from Strapi
  name: string | null;
  group_columns: number | null;
  blocks: SDUIBlock[]; // recursive: already-normalized blocks at this level
}

/**
 * Props for the blocks.section component — top-level container in page.content.
 * children: block-groups populated via oneToMany relation.
 * deep_children: escape hatch for >2 nesting levels; untyped by design (ADR-4).
 */
export interface SectionProps {
  name: string | null;
  section_columns: number | null;
  children: BlockGroupContent[];
  /** Injected by BlockRenderer; forwarded to nested renderers. */
  pagePath?: string;
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
  | ({ __component: "blocks.staff-section" } & StaffSectionProps)
  | ({ __component: "blocks.bullet-list" } & BulletListProps)
  | ({ __component: "blocks.key-dates" } & KeyDatesProps)
  | ({ __component: "blocks.info-card" } & InfoCardProps)
  | ({ __component: "blocks.clinic-schedule" } & ClinicScheduleProps)
  | ({ __component: "blocks.icon-strip" } & IconStripProps)
  | ({ __component: "blocks.map-schedule" } & MapScheduleProps)
  | ({ __component: "blocks.section" } & SectionProps) // nested SDUI container (ADR-1)
  | ({ __component: "blocks.form" } & FormBlockProps)
  | ({ __component: "blocks.magazine-archive" } & MagazineArchiveProps)
  | ({ __component: "blocks.accordion" } & AccordionBlockProps)
  | ({ __component: "blocks.tabs" } & TabsBlockProps)
  | ({ __component: "blocks.carousel" } & CarouselBlockProps)
  | ({ __component: "blocks.table" } & TableBlockProps)
  | { __component: string }; // forward-compat fallback for unknown blocks
