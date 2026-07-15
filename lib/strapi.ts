/**
 * Strapi GraphQL client — server-side only.
 *
 * REQ-G01: Raw fetch POST, no third-party GraphQL client.
 * REQ-C01: STRAPI_URL + STRAPI_API_TOKEN are server-side only (no NEXT_PUBLIC_).
 * Decision #9: Single unified query per path (page + blocks + navbar + footer).
 *
 * Caching: Next.js 16 fetch with `next: { revalidate: 86400 }` (24h ISR).
 * Verified against node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md:
 *   - `options.next.revalidate` is unchanged from Next 15.
 *   - Setting a number specifies cache lifetime in seconds.
 *   - Next.js keys POST fetches by URL + body (so each unique path = own cache entry).
 *
 * DEVIATION from design (#1): Strapi GraphQL returns `__typename` (GraphQL introspection field,
 *   e.g. "ComponentBlocksHeroLanding"), NOT `__component` (Strapi uid, e.g. "blocks.hero-landing").
 *   `__typename` CANNOT be aliased in GraphQL (meta-fields are unaliasable per spec).
 *   Strapi's plugin-graphql exposes `__component` internally for `resolveType` only — it is NOT
 *   a queryable schema field.
 *   Fix: normalizeBlocks() converts __typename → __component after fetch using a stable lookup map.
 *   All TS types retain the "blocks.X" / "elements.X" discriminant format per design.
 */

import type { PageQueryResult, RouteData, NavbarData, RouteNavItem, MobileNavItem, FooterColumn } from "@/types/page";
import type { SDUIBlock, BlockGroupContent } from "@/types/blocks";
import type { ButtonVariant } from "@/types/elements";
import type { StrapiMedia } from "@/types/strapi";
import { env } from "./env";

// ---------------------------------------------------------------------------
// Core GraphQL fetcher
// ---------------------------------------------------------------------------

/**
 * gql — typed GraphQL POST with 24h Next.js ISR cache.
 *
 * @param query     - GraphQL document string
 * @param variables - Optional query variables
 * @param nextOpts  - Optional `next` override merged over `{ revalidate: 86400 }`.
 *                    Pass `{ tags: [...] }` to enable on-demand revalidation via
 *                    revalidateTag(). Spec C — "Cache Tags on Strapi Fetches".
 * @returns Typed `data` field from the GraphQL response
 * @throws Error on non-2xx HTTP status or GraphQL `errors`
 */
export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>,
  nextOpts?: { revalidate?: number; tags?: string[] }
): Promise<T> {
  const res = await fetch(`${env.strapi.url}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.strapi.token}`,
    },
    body: JSON.stringify({ query, variables }),
    // 24h time-based ISR — Decision #9
    // Source: node_modules/next/dist/docs/.../fetch.md §options.next.revalidate
    next: { revalidate: 86400, ...nextOpts },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`Strapi GraphQL request failed: HTTP ${res.status} — ${body}`);
  }

  const json = (await res.json()) as { data: T; errors?: unknown[] };

  if (json.errors && json.errors.length > 0) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

// ---------------------------------------------------------------------------
// __typename → __component mapping
// Strapi GraphQL returns globalId names (e.g. "ComponentBlocksHeroLanding").
// We convert them to Strapi uid format (e.g. "blocks.hero-landing") so that
// the TS discriminated union and block registry use the stable "blocks.X" key.
// ---------------------------------------------------------------------------

/** Maps Strapi GraphQL globalId to Strapi component uid. */
const TYPENAME_TO_COMPONENT: Record<string, string> = {
  ComponentBlocksHeroLanding: "blocks.hero-landing",
  ComponentBlocksHeroPage: "blocks.hero-page",
  ComponentBlocksContentGrid: "blocks.content-grid",
  ComponentBlocksPhotoGallery: "blocks.photo-gallery",
  ComponentBlocksQuickLinks: "blocks.quick-links",
  ComponentBlocksTimeline: "blocks.timeline",
  ComponentBlocksMissionVision: "blocks.mission-vision",
  ComponentBlocksProcessSteps: "blocks.process-steps",
  ComponentBlocksBulletList: "blocks.bullet-list",
  ComponentBlocksKeyDates: "blocks.key-dates",
  ComponentBlocksInfoCard: "blocks.info-card",
  ComponentBlocksRichText: "blocks.rich-text",
  ComponentBlocksCta: "blocks.cta",
  ComponentBlocksCalendar: "blocks.calendar",
  ComponentBlocksMap: "blocks.map",
  ComponentBlocksStaffSection: "blocks.staff-section",
  ComponentBlocksClinicSchedule: "blocks.clinic-schedule",
  ComponentBlocksIconStrip: "blocks.icon-strip",
  ComponentBlocksMapSchedule: "blocks.map-schedule",
  ComponentBlocksSection: "blocks.section",
  ComponentBlocksForm: "blocks.form",
  ComponentBlocksMagazineArchive: "blocks.magazine-archive",
  ComponentBlocksAccordion: "blocks.accordion",
  ComponentBlocksTabs: "blocks.tabs",
  ComponentBlocksCarousel: "blocks.carousel",
  ComponentBlocksTable: "blocks.table",
};

const FOOTER_TYPENAME_TO_COMPONENT: Record<string, string> = {
  ComponentFooterColumnInstitution: "footer.column-institution",
  ComponentFooterColumnLinks: "footer.column-links",
  ComponentFooterColumnContact: "footer.column-contact",
  ComponentFooterColumnText: "footer.column-text",
};

function normalizeFooterColumns(
  columns: Array<Record<string, unknown>>
): FooterColumn[] {
  return columns.map((col) => {
    const typename = col.__typename as string | undefined;
    if (!typename) return col as unknown as FooterColumn;
    const component = FOOTER_TYPENAME_TO_COMPONENT[typename] ?? typename;
    const { __typename: _removed, ...rest } = col;
    return { ...rest, __component: component } as FooterColumn;
  });
}

const MAX_NESTING_DEPTH = 2;

/**
 * Converts __typename fields on a blocks array into __component (Strapi uid format).
 * For blocks.section: recurses into children[].blocks with cycle detection and depth guard.
 *
 * @param blocks   - Raw block array from GraphQL response
 * @param visited  - Set of block-group documentIds already in the current ancestor chain (ADR-3)
 * @param depth    - Current recursion depth; guard fires at MAX_NESTING_DEPTH (ADR-5, ADR-6)
 */
function normalizeBlocks(
  blocks: Array<Record<string, unknown>>,
  visited: Set<string> = new Set(),
  depth: number = 0
): SDUIBlock[] {
  return blocks.map((block) => {
    const typename = block.__typename as string | undefined;
    const component = typename ? (TYPENAME_TO_COMPONENT[typename] ?? typename) : undefined;
    const { __typename: _removed, ...rest } = block;
    const base = { ...rest, __component: component } as Record<string, unknown>;

    if (component === "blocks.section") {
      const rawChildren = (block.children as RawBlockGroup[] | undefined) ?? [];

      if (depth >= MAX_NESTING_DEPTH) {
        console.warn(
          `[normalizeBlocks] section at depth ${depth} exceeds MAX_NESTING_DEPTH (${MAX_NESTING_DEPTH}); rendering with empty children.`
        );
        return { ...base, children: [] } as unknown as SDUIBlock;
      }

      const normalizedChildren: BlockGroupContent[] = rawChildren
        .map((group) => {
          const id = group.documentId;
          if (!id) return null;
          if (visited.has(id)) {
            console.warn(
              `[normalizeBlocks] cycle detected on block-group "${id}"; skipping.`
            );
            return null;
          }
          const nextVisited = new Set(visited).add(id);
          return {
            id,
            name: group.name ?? null,
            group_columns: group.group_columns ?? null,
            blocks: normalizeBlocks(group.blocks ?? [], nextVisited, depth + 1),
          };
        })
        .filter((g): g is BlockGroupContent => g !== null);

      return { ...base, children: normalizedChildren } as SDUIBlock;
    }

    // Standard flat block (the 19 leaf types): no recursion.
    if (!typename) return block as SDUIBlock;
    return base as SDUIBlock;
  });
}

// ---------------------------------------------------------------------------
// Inline fragment helpers (REQ-G03)
// Stratified fragments — ADR-2: two levels to avoid recursive GraphQL fragments.
// LEAF_BLOCK_FRAGMENTS: the 19 flat blocks (no section). Reusable at any depth.
// SECTION_BLOCK_FRAGMENT_L1: section populated with LEAF children (level 1 only).
// TOP_LEVEL_BLOCK_FRAGMENTS: what page.content receives (LEAF + SECTION_L1).
// ---------------------------------------------------------------------------

const LEAF_BLOCK_FRAGMENTS = /* GraphQL */ `
  ... on ComponentBlocksHeroLanding {
    __typename
    title
    subtitle
    backgroundImage { documentId url alternativeText width height mime name }
    buttons { label url variant icon }
  }
  ... on ComponentBlocksHeroPage {
    __typename
    title
    subtitle
    backgroundImage { documentId url alternativeText width height mime name }
    gradient
  }
  ... on ComponentBlocksContentGrid {
    __typename
    title
    collection_type
    card_style
    columns
    items {
      title description
      image { documentId url alternativeText width height mime name }
      url tag customClasses
    }
  }
  ... on ComponentBlocksPhotoGallery {
    __typename
    title
    subtitle
    images { documentId url alternativeText width height mime name }
    photo_columns
  }
  ... on ComponentBlocksQuickLinks {
    __typename
    title
    ql_columns
    links { label url icon description }
  }
  ... on ComponentBlocksTimeline {
    __typename
    title
    items { year title description }
  }
  ... on ComponentBlocksMissionVision {
    __typename
    mission_title
    mission_text
    vision_title
    vision_text
  }
  ... on ComponentBlocksProcessSteps {
    __typename
    title
    steps { number title description icon }
  }
  ... on ComponentBlocksRichText {
    __typename
    content
  }
  ... on ComponentBlocksCta {
    __typename
    title
    description
    buttons { label url variant }
  }
  ... on ComponentBlocksCalendar {
    __typename
    title
    items { date title description category }
  }
  ... on ComponentBlocksMap {
    __typename
    title
    address
    embed_url
    latitude
    longitude
  }
  ... on ComponentBlocksStaffSection {
    __typename
    titulo
    unidad {
      documentId
      nombre
      tipo
      miembros {
        documentId
        nombre
        cargo
        descripcion
        foto { documentId url alternativeText width height mime name }
      }
    }
  }
  ... on ComponentBlocksBulletList {
    __typename
    title
    items { text }
    cta { label url variant icon }
  }
  ... on ComponentBlocksKeyDates {
    __typename
    title
    display_mode
    items { start_date end_date label description }
  }
  ... on ComponentBlocksInfoCard {
    __typename
    title
    body
    cta { label url variant icon }
  }
  ... on ComponentBlocksClinicSchedule {
    __typename
    clinic_name
    hours { day_range time_range }
    schedule_text
  }
  ... on ComponentBlocksIconStrip {
    __typename
    title
    links { label url icon description }
  }
  ... on ComponentBlocksMapSchedule {
    __typename
    clinic_name
    address
    embed_url
    hours { day_range time_range }
    schedule_text
  }
  ... on ComponentBlocksForm {
    __typename
    title
    submit_label
    form {
      documentId
      title
      description
      submit_label
      success_message
      error_message
      fields {
        name
        label
        field_type
        required
        placeholder
        help_text
        options
        min_length
        max_length
      }
    }
  }
  ... on ComponentBlocksMagazineArchive {
    __typename
    title
    publications { documentId name slug }
  }
  ... on ComponentBlocksAccordion {
    __typename
    title
    items { label content }
  }
  ... on ComponentBlocksTabs {
    __typename
    title
    items { label content }
  }
  ... on ComponentBlocksCarousel {
    __typename
    title
    autoplay
    slides {
      image { documentId url alternativeText width height mime name }
      title
      text
      link
    }
  }
  ... on ComponentBlocksTable {
    __typename
    title
    description
    data
  }
`;

// Section fragment level 1: populates children.blocks with LEAF fragments only.
// GraphQL prohibits recursive fragments, so section nesting is resolved at query-build time.
const SECTION_BLOCK_FRAGMENT_L1 = /* GraphQL */ `
  ... on ComponentBlocksSection {
    __typename
    name
    section_columns
    children {
      documentId
      name
      group_columns
      blocks {
        ${LEAF_BLOCK_FRAGMENTS}
      }
    }
  }
`;

// What gets inserted into page.content dynamic zone: all leaf blocks + section-with-leaf-children.
const TOP_LEVEL_BLOCK_FRAGMENTS = /* GraphQL */ `
  ${LEAF_BLOCK_FRAGMENTS}
  ${SECTION_BLOCK_FRAGMENT_L1}
`;

// ---------------------------------------------------------------------------
// Unified page query (Decision #9 — single round-trip)
// ---------------------------------------------------------------------------

const PAGE_BY_PATH_QUERY = /* GraphQL */ `
  query PageByPath($path: String!) {
    routeByPath: routes(filters: { path: { eq: $path } }) {
      documentId
      path
      label
      type
      slug
      active
      visibility
      allowed_roles { key }
      parent {
        active
        parent {
          active
        }
      }
      page {
        documentId
        title
        layout
        content {
          ${TOP_LEVEL_BLOCK_FRAGMENTS}
        }
      }
    }
    navTree: routes(
      filters: { parent: { documentId: { null: true } } }
      sort: "order:asc"
      pagination: { limit: 100 }
    ) {
      documentId
      path
      label
      slug
      type
      order
      active
      visibility
      allowed_roles { key }
      children(sort: "order:asc") {
        documentId
        path
        label
        slug
        type
        order
        active
        visibility
        allowed_roles { key }
        children(sort: "order:asc") {
          documentId
          path
          label
          slug
          type
          order
          active
          visibility
          allowed_roles { key }
          children(sort: "order:asc") {
            documentId
            path
            label
            slug
            type
            order
            active
            visibility
            allowed_roles { key }
          }
        }
      }
    }
    mobileNavbar {
      items {
        label
        icon
        external_url
        route {
          path
          visibility
          allowed_roles { key }
          active
          type
          page {
            documentId
          }
        }
      }
    }
    footer {
      copyright
      bottom_links { label url variant icon }
      columns {
        ... on ComponentFooterColumnInstitution {
          __typename
          institution_name
          sub_name
          description
          logo { documentId url alternativeText width height mime name }
          social_links { label url variant icon }
        }
        ... on ComponentFooterColumnLinks {
          __typename
          heading
          links { label url variant icon }
        }
        ... on ComponentFooterColumnContact {
          __typename
          heading
          address
          phone
          email
        }
        ... on ComponentFooterColumnText {
          __typename
          heading
          body
        }
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Strapi GraphQL response shape for PageByPath (raw, before normalization)
// ---------------------------------------------------------------------------

interface RawBlock extends Record<string, unknown> {
  __typename: string;
}

/** Raw block-group as returned by GraphQL inside a section's children array. */
interface RawBlockGroup {
  documentId: string;
  name: string | null;
  group_columns: number | null;
  blocks: RawBlock[];
}

/** Raw allowed_roles relation — `key` is a Strapi uid, nullable until generated. */
type RawAllowedRoles = Array<{ key: string | null }> | null;

interface RawRouteNode {
  documentId: string;
  path: string;
  label: string | null;
  slug: string | null;
  type: 'page' | 'section' | 'header';
  order: number;
  active: boolean;
  visibility?: string | null; // GraphQL serialises the enum as 'requires_login' (no hyphens allowed)
  allowed_roles?: RawAllowedRoles;
  children?: RawRouteNode[];
}

interface RawRouteParent {
  active: boolean;
  parent?: RawRouteParent | null;
}

interface PageByPathResponse {
  routeByPath: Array<{
    documentId: string;
    path: string;
    label: string | null;
    type: 'page' | 'section' | 'header';
    slug: string | null;
    active: boolean;
    visibility?: string | null; // GraphQL serialises the enum as 'requires_login' (no hyphens allowed)
    allowed_roles?: RawAllowedRoles;
    parent: RawRouteParent | null;
    page: {
      documentId: string;
      title: string;
      layout: "default" | "full-width";
      content: RawBlock[];
    } | null;
  }>;
  navTree: RawRouteNode[];
  mobileNavbar: {
    items: Array<{
      label: string;
      icon: string | null;
      external_url: string | null;
      route: {
        path: string;
        visibility?: string | null; // GraphQL serialises the enum as 'requires_login' (no hyphens allowed)
        allowed_roles?: RawAllowedRoles;
        active: boolean;
        type: 'page' | 'section' | 'header';
        page: { documentId: string } | null;
      } | null;
    }> | null;
  } | null;
  footer: {
    copyright: string | null;
    bottom_links: Array<{ label: string; url: string | null; variant: ButtonVariant; icon: string | null }>;
    columns: Array<Record<string, unknown> & { __typename: string }>;
  } | null;
}

// ---------------------------------------------------------------------------
// Nav tree mapper
// ---------------------------------------------------------------------------

/**
 * GraphQL cannot represent hyphens in enum values, so Strapi serialises the
 * `requires-login` enum as `requires_login`. Normalise back to the domain
 * form here — every consumer (page gate, navbar filter) compares against
 * 'requires-login'.
 */
function normalizeVisibility(
  v: string | null | undefined
): 'public' | 'requires-login' {
  return v === 'requires_login' || v === 'requires-login'
    ? 'requires-login'
    : 'public';
}

/** Flattens the allowed_roles relation to role keys, dropping never-generated uids. */
function mapAllowedRoles(roles: RawAllowedRoles | undefined): string[] {
  return (roles ?? []).flatMap((r) => (r.key ? [r.key] : []));
}

function mapRouteNode(r: RawRouteNode): RouteNavItem {
  return {
    documentId: r.documentId,
    path: r.path,
    label: r.label,
    slug: r.slug,
    type: r.type,
    order: r.order,
    active: r.active,
    visibility: normalizeVisibility(r.visibility),
    allowedRoles: mapAllowedRoles(r.allowed_roles),
    children: (r.children ?? [])
      .filter((c) => c.active !== false)
      .map(mapRouteNode),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getPageByPath — resolves a URL path to its route, page (with blocks),
 * and global navbar/footer data in a single GraphQL request.
 *
 * Decision #9: unified query, cached 24h via `next: { revalidate: 86400 }`.
 *
 * @param path - URL path starting with "/" (e.g. "/", "/historia", "/posgrado/admision")
 * @returns PageQueryResult or null if the Strapi request fails entirely
 */
export async function getPageByPath(
  path: string
): Promise<PageQueryResult | null> {
  let data: PageByPathResponse;

  try {
    // Spec C: tag with page-specific + collection tags for on-demand revalidation
    data = await gql<PageByPathResponse>(
      PAGE_BY_PATH_QUERY,
      { path },
      { tags: [`page:${path}`, 'pages', 'routes'] }
    );
  } catch (err) {
    console.error(`[strapi] getPageByPath("${path}") failed:`, err);
    return null;
  }

  // Resolve route (first match or null)
  const rawRoute = data.routeByPath[0] ?? null;

  function isAncestorDisabled(parent: RawRouteParent | null | undefined): boolean {
    if (!parent) return false;
    if (parent.active === false) return true;
    return isAncestorDisabled(parent.parent);
  }

  const isRouteEnabled = rawRoute
    ? rawRoute.active !== false && !isAncestorDisabled(rawRoute.parent)
    : false;

  const route: RouteData | null = rawRoute && isRouteEnabled
    ? {
        documentId: rawRoute.documentId,
        path: rawRoute.path,
        label: rawRoute.label,
        type: rawRoute.type,
        slug: rawRoute.slug,
        visibility: normalizeVisibility(rawRoute.visibility),
        allowedRoles: mapAllowedRoles(rawRoute.allowed_roles),
        page: rawRoute.page
          ? {
              documentId: rawRoute.page.documentId,
              title: rawRoute.page.title,
              layout: rawRoute.page.layout,
              content: normalizeBlocks(rawRoute.page.content),
            }
          : null,
      }
    : null;

  // Build navbar from root routes tree
  const mobileNav: MobileNavItem[] = (data.mobileNavbar?.items ?? []).map(
    (item) => ({
      label: item.label,
      icon: item.icon,
      external_url: item.external_url,
      route: item.route
        ? {
            path: item.route.path,
            visibility: normalizeVisibility(item.route.visibility),
            allowedRoles: mapAllowedRoles(item.route.allowed_roles),
            active: item.route.active,
            type: item.route.type,
            hasPage: item.route.page != null,
          }
        : null,
    })
  );

  const navbar: NavbarData = {
    items: data.navTree
      .filter((r) => r.active !== false)
      .map(mapRouteNode),
    mobileNav,
  };

  return {
    route,
    navbar,
    footer: data.footer
      ? {
          columns: normalizeFooterColumns(data.footer.columns ?? []),
          copyright: data.footer.copyright,
          bottom_links: data.footer.bottom_links ?? [],
        }
      : {
          columns: [],
          copyright: null,
          bottom_links: [],
        },
  };
}

// ---------------------------------------------------------------------------
// Global Theme (admin-editable brand palette)
// ---------------------------------------------------------------------------

export interface BasicColors {
  navy: string | null;
  accent: string | null;
  red: string | null;
  surface: string | null;
  surface_raised: string | null;
  text_base: string | null;
  text_body: string | null;
  border_input: string | null;
  input_focus_ring: string | null;
  action_primary: string | null;
}

export interface AdvancedColors {
  surface_sunken: string | null;
  border: string | null;
  border_subtle: string | null;
  text_strong: string | null;
  text_secondary: string | null;
  text_muted: string | null;
  text_faint: string | null;
  input_bg: string | null;
  input_text: string | null;
  input_checked: string | null;
  action_primary_hover: string | null;
  state_success: string | null;
  state_error: string | null;
}

export interface GlobalTheme {
  light: BasicColors | null;
  dark: BasicColors | null;
  light_advanced: AdvancedColors | null;
  dark_advanced: AdvancedColors | null;
}

const BASIC_FIELDS = `
  navy accent red surface surface_raised
  text_base text_body border_input input_focus_ring action_primary
`;

const ADVANCED_FIELDS = `
  surface_sunken border border_subtle
  text_strong text_secondary text_muted text_faint
  input_bg input_text input_checked action_primary_hover
  state_success state_error
`;

const GLOBAL_THEME_QUERY = /* GraphQL */ `
  query GetGlobalTheme {
    globalTheme {
      light { ${BASIC_FIELDS} }
      dark { ${BASIC_FIELDS} }
      light_advanced { ${ADVANCED_FIELDS} }
      dark_advanced { ${ADVANCED_FIELDS} }
    }
  }
`;

interface GlobalThemeResponse {
  globalTheme: GlobalTheme | null;
}

/**
 * getGlobalTheme — fetches the admin-editable brand palette.
 *
 * Uses the shared `gql<T>()` helper (inherits the 24h ISR cache — no inline
 * `next: { revalidate }` override). On ANY failure (network, GraphQL errors,
 * Strapi unreachable, or missing public read permission) it logs and returns
 * `null` so the consumer (`<ThemeVars/>`) can fall back to hardcoded defaults.
 * It never re-throws and is fully independent of `getPageByPath`.
 *
 * T-03 MANUAL: enable public GraphQL read for this singleType in Strapi Admin
 * → Settings → Roles → Public → global-theme → enable `find`. Without it this
 * call resolves to `null` (handled gracefully) and the site uses fallbacks.
 *
 * @returns The palette (fields may be null) or `null` if the request fails.
 */
export async function getGlobalTheme(): Promise<GlobalTheme | null> {
  try {
    const data = await gql<GlobalThemeResponse>(GLOBAL_THEME_QUERY, undefined, { tags: ['routes'] });
    return data.globalTheme;
  } catch (err) {
    console.error("[strapi] getGlobalTheme() failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Magazine issues
// ---------------------------------------------------------------------------

/** A single converted page image from Strapi. */
export interface MagazineIssuePage {
  url: string;
  width: number | null;
  height: number | null;
}

/** Normalised magazine issue — used by the viewer and archive grid. */
export interface MagazineIssue {
  documentId: string;
  slug: string;
  title: string;
  number: number | null;
  date: string | null;
  description: string | null;
  cover: StrapiMedia | null;
  pdf: { url: string } | null;
  pages: MagazineIssuePage[];
  conversionStatus: "processing" | "ready" | "failed";
  publishedAt: string | null;
  publication: { documentId: string } | null;
}

// Raw response shapes (pre-normalisation, straight from GraphQL)
interface RawMagazineIssue {
  documentId: string;
  slug: string;
  title: string;
  number: number | null;
  date: string | null;
  description: string | null;
  cover: StrapiMedia | null;
  pdf: { url: string } | null;
  pages: MagazineIssuePage[];
  conversionStatus: "processing" | "ready" | "failed";
  publishedAt: string | null;
  publication: { documentId: string } | null;
}

interface MagazineIssueBySlugResponse {
  magazineIssues: RawMagazineIssue[];
}

interface AllMagazineIssuesResponse {
  magazineIssues: RawMagazineIssue[];
}

const MAGAZINE_ISSUE_BY_SLUG_QUERY = /* GraphQL */ `
  query MagazineIssueBySlug($slug: String!) {
    magazineIssues(
      filters: { slug: { eq: $slug }, conversionStatus: { eq: "ready" } }
      pagination: { limit: 1 }
    ) {
      documentId
      slug
      title
      number
      date
      description
      pdf { url }
      pages(pagination: { limit: -1 }) { url width height }
      conversionStatus
      publishedAt
      publication { documentId }
    }
  }
`;

// $publicationIds narrows the archive to the block's selected publications;
// pass null/omit for "all publications".
const ALL_READY_MAGAZINE_ISSUES_QUERY = /* GraphQL */ `
  query AllReadyMagazineIssues($filters: MagazineIssueFiltersInput) {
    magazineIssues(
      filters: $filters
      sort: "date:desc"
      pagination: { limit: 100 }
    ) {
      documentId
      slug
      title
      number
      date
      description
      cover {
        documentId
        url
        alternativeText
        width
        height
        mime
        name
      }
      conversionStatus
      publishedAt
      publication { documentId }
    }
  }
`;

/**
 * getMagazineIssueBySlug — fetch a single ready magazine issue by its slug.
 *
 * Returns null when the slug does not exist, the issue is not yet ready,
 * or the Strapi request fails.
 *
 * @param slug - The issue slug (e.g. "edicion-1")
 */
export async function getMagazineIssueBySlug(
  slug: string
): Promise<MagazineIssue | null> {
  try {
    const data = await gql<MagazineIssueBySlugResponse>(
      MAGAZINE_ISSUE_BY_SLUG_QUERY,
      { slug },
      { tags: [`magazine-issue:${slug}`, "magazine-issues"] }
    );
    return data.magazineIssues[0] ?? null;
  } catch (err) {
    console.error(`[strapi] getMagazineIssueBySlug("${slug}") failed:`, err);
    return null;
  }
}

/**
 * getAllReadyMagazineIssues — fetch published + ready magazine issues for
 * the archive grid, sorted newest-first. Capped at 100 items.
 *
 * @param publicationIds - When provided and non-empty, only issues belonging
 *                         to these publications are returned (archive block
 *                         selection). Omit for all publications.
 *
 * Returns an empty array on failure (component renders the empty state).
 */
export async function getAllReadyMagazineIssues(
  publicationIds?: string[]
): Promise<MagazineIssue[]> {
  const filters: Record<string, unknown> = {
    conversionStatus: { eq: "ready" },
  };
  if (publicationIds && publicationIds.length > 0) {
    filters.publication = { documentId: { in: publicationIds } };
  }

  try {
    const data = await gql<AllMagazineIssuesResponse>(
      ALL_READY_MAGAZINE_ISSUES_QUERY,
      { filters },
      { tags: ["magazine-issues"] }
    );
    return data.magazineIssues;
  } catch (err) {
    console.error("[strapi] getAllReadyMagazineIssues() failed:", err);
    return [];
  }
}
