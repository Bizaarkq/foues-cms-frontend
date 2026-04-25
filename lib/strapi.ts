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

import type { PageQueryResult, RouteData, NavbarData, RouteNavItem, FooterColumn } from "@/types/page";
import type { SDUIBlock } from "@/types/blocks";
import { env } from "./env";

// ---------------------------------------------------------------------------
// Core GraphQL fetcher
// ---------------------------------------------------------------------------

/**
 * gql — typed GraphQL POST with 24h Next.js ISR cache.
 *
 * @param query  - GraphQL document string
 * @param variables - Optional query variables
 * @returns Typed `data` field from the GraphQL response
 * @throws Error on non-2xx HTTP status or GraphQL `errors`
 */
export async function gql<T>(
  query: string,
  variables?: Record<string, unknown>
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
    next: { revalidate: 86400 },
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
  ComponentBlocksRichText: "blocks.rich-text",
  ComponentBlocksCta: "blocks.cta",
  ComponentBlocksCalendar: "blocks.calendar",
  ComponentBlocksMap: "blocks.map",
  ComponentBlocksStaffSection: "blocks.staff-section",
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
    if (!typename) return col as FooterColumn;
    const component = FOOTER_TYPENAME_TO_COMPONENT[typename] ?? typename;
    const { __typename: _removed, ...rest } = col;
    return { ...rest, __component: component } as FooterColumn;
  });
}

/**
 * Converts __typename fields on a blocks array into __component (Strapi uid format).
 * Unknown types are passed through with their __typename as-is (forward-compat).
 */
function normalizeBlocks(
  blocks: Array<Record<string, unknown>>
): SDUIBlock[] {
  return blocks.map((block) => {
    const typename = block.__typename as string | undefined;
    if (!typename) return block as SDUIBlock;
    const component = TYPENAME_TO_COMPONENT[typename] ?? typename;
    const { __typename: _removed, ...rest } = block;
    return { ...rest, __component: component } as SDUIBlock;
  });
}

// ---------------------------------------------------------------------------
// Inline fragment helpers (REQ-G03)
// All 12 block inline fragments — each selects __typename for discrimination.
// ---------------------------------------------------------------------------

const BLOCK_FRAGMENTS = /* GraphQL */ `
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
      page {
        documentId
        title
        layout
        content {
          ${BLOCK_FRAGMENTS}
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
      children(sort: "order:asc") {
        documentId
        path
        label
        slug
        type
        order
        children(sort: "order:asc") {
          documentId
          path
          label
          slug
          type
          order
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

interface RawRouteNode {
  documentId: string;
  path: string;
  label: string | null;
  slug: string | null;
  type: 'page' | 'section' | 'header';
  order: number;
  children?: RawRouteNode[];
}

interface PageByPathResponse {
  routeByPath: Array<{
    documentId: string;
    path: string;
    label: string | null;
    type: 'page' | 'section' | 'header';
    slug: string | null;
    page: {
      documentId: string;
      title: string;
      layout: "default" | "full-width";
      content: RawBlock[];
    } | null;
  }>;
  navTree: RawRouteNode[];
  footer: {
    copyright: string | null;
    bottom_links: Array<{ label: string; url: string | null; variant: string; icon: string | null }>;
    columns: Array<Record<string, unknown> & { __typename: string }>;
  } | null;
}

// ---------------------------------------------------------------------------
// Nav tree mapper
// ---------------------------------------------------------------------------

function mapRouteNode(r: RawRouteNode): RouteNavItem {
  return {
    documentId: r.documentId,
    path: r.path,
    label: r.label,
    slug: r.slug,
    type: r.type,
    order: r.order,
    children: (r.children ?? []).map(mapRouteNode),
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
    data = await gql<PageByPathResponse>(PAGE_BY_PATH_QUERY, { path });
  } catch (err) {
    console.error(`[strapi] getPageByPath("${path}") failed:`, err);
    return null;
  }

  // Resolve route (first match or null)
  const rawRoute = data.routeByPath[0] ?? null;

  const route: RouteData | null = rawRoute
    ? {
        documentId: rawRoute.documentId,
        path: rawRoute.path,
        label: rawRoute.label,
        type: rawRoute.type,
        slug: rawRoute.slug,
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
  const navbar: NavbarData = {
    items: data.navTree.map(mapRouteNode),
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
