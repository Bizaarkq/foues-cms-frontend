/**
 * Catch-all page renderer for SDUI routes.
 *
 * REQ-N01: [[...slug]] captures root "/" (slug undefined) and all nested paths.
 * REQ-N02: `params` is a Promise in Next.js 16 — must be awaited.
 *   Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
 *
 * Data flow:
 *   1. Normalize slug → path string (e.g. ["posgrado","admision"] → "/posgrado/admision")
 *   2. resolvePath(path) — React.cache-wrapped resolver shared by the Page
 *      component and generateMetadata (getPageByPath is a POST fetch, which
 *      Next does NOT memoize — cache() dedupes the two calls per request).
 *   3. Discriminated union decides: page | paginated-list | not-found.
 *   4. Select layout wrapper based on page.layout enum.
 *   5. BlockRenderer dispatches each block to its registered component.
 *
 * Magazine editions live at the dedicated /revista/{slug} route (static
 * segment, takes precedence over this catch-all) — no derived-URL fallback.
 *
 * Article pagination as virtual child:
 *   `{path-of-the-page-holding-an-article-list}/pagina/{n}` re-renders the
 *   parent page with `pageNumber` injected through BlockRenderer. Each page
 *   number is a distinct path (own ISR entry — no searchParams). n = 1 is
 *   canonical at the parent path itself, so `/pagina/1` redirects there.
 */

import { cache } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPageByPath } from "@/lib/strapi";
import { auth } from "@/lib/auth";
import { mediaUrl } from "@/lib/media";
import { childPath } from "@/lib/paths";
import {
  absoluteUrl,
  findBlocksByComponent,
  firstHeroImage,
  mineDescription,
} from "@/lib/seo";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import { FullWidthLayout } from "@/components/sdui/layouts/FullWidthLayout";
import { BlockRenderer } from "@/components/sdui/BlockRenderer";
import type { PageQueryResult, RouteData } from "@/types/page";
import type { StrapiMedia } from "@/types/strapi";

/**
 * Authoritative access gate (Spec B + gating por rol, spec sesión §7):
 * - 'requires-login' → exige sesión; anónimo va a /login.
 * - allowedRoles no vacía → exige sesión Y que el rol del JWT esté en la
 *   lista. Anónimo va a /login (puede tener el rol tras loguearse); un
 *   usuario logueado sin el rol recibe 404 — la ruta no se le revela
 *   (el navbar ya se la oculta con el mismo criterio).
 * El rol se lee del JWT (cero queries extra); cambios de rol aplican en
 * el siguiente login — limitación aceptada.
 */
async function enforceRouteAccess(route: {
  visibility: "public" | "requires-login";
  allowedRoles: string[];
}): Promise<void> {
  const requiresSession =
    route.visibility === "requires-login" || route.allowedRoles.length > 0;
  if (!requiresSession) return;

  const session = await auth();
  if (!session) redirect("/login");

  if (route.allowedRoles.length > 0) {
    const roleKey = session.user?.role?.key ?? null;
    if (roleKey === null || !route.allowedRoles.includes(roleKey)) {
      notFound();
    }
  }
}

// ---------------------------------------------------------------------------
// Path resolution — shared by the Page component and generateMetadata
// ---------------------------------------------------------------------------

type ResolvedPath =
  | { kind: "page"; data: PageQueryResult; path: string }
  | {
      kind: "paginated-list";
      data: PageQueryResult;
      /** Parent path — the page holding the article-list block. */
      path: string;
      pageNumber: number;
    }
  | { kind: "not-found" };

/**
 * Resolves a URL path to one of the four render kinds WITHOUT calling
 * notFound()/redirect() — consumers decide. Wrapped in React cache() so the
 * Page component and generateMetadata share the underlying getPageByPath
 * POST fetches within a request.
 */
const resolvePath = cache(async (path: string): Promise<ResolvedPath> => {
  const segments = path.split("/").filter(Boolean);

  const data = await getPageByPath(path);

  // Hard failure: Strapi request returned nothing at all
  if (!data) return { kind: "not-found" };

  if (data.route && data.route.page) {
    return { kind: "page", data, path };
  }

  // Article-pagination virtual child: `{parentPath}/pagina/{n}` re-renders
  // the parent page (if it holds an article-list block) with pageNumber n.
  // 2 segments = the parent is the home page ("/").
  if (segments.length >= 2 && segments[segments.length - 2] === "pagina") {
    const pageSegment = segments[segments.length - 1];
    const pageNumber = /^\d+$/.test(pageSegment) ? Number(pageSegment) : NaN;
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      return { kind: "not-found" };
    }

    const parentPath = "/" + segments.slice(0, -2).join("/");
    const parentData = await getPageByPath(parentPath);
    const parentPage = parentData?.route?.page;

    if (parentData?.route && parentPage) {
      const hasArticleList =
        findBlocksByComponent(parentPage.content, "blocks.article-list").length > 0;

      if (hasArticleList) {
        return { kind: "paginated-list", data: parentData, path: parentPath, pageNumber };
      }
    }

    return { kind: "not-found" };
  }

  return { kind: "not-found" };
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/** og:image entry from a Strapi media, with alt/dimensions when present. */
function ogImages(media: StrapiMedia | null) {
  const url = mediaUrl(media);
  if (!url) return undefined;
  return [
    {
      url,
      ...(media?.alternativeText ? { alt: media.alternativeText } : {}),
      ...(media?.width != null ? { width: media.width } : {}),
      ...(media?.height != null ? { height: media.height } : {}),
    },
  ];
}

/** Non-public routes must never be indexed, regardless of CMS SEO settings. */
function isGatedRoute(route: RouteData): boolean {
  return route.visibility !== "public" || route.allowedRoles.length > 0;
}

/**
 * Metadata for a resolved SDUI page. `pageNumber` > 1 marks a `/pagina/{n}`
 * virtual child: same parent pipeline, suffixed title, canonical on the
 * virtual path itself.
 */
function pageMetadata(data: PageQueryResult, path: string, pageNumber = 1): Metadata {
  const route = data.route!;
  const page = route.page!;
  const seo = page.seo;

  const baseTitle = seo?.metaTitle ?? page.title ?? route.label ?? undefined;
  const title =
    pageNumber > 1 && baseTitle ? `${baseTitle} — Página ${pageNumber}` : baseTitle;
  const description = seo?.metaDescription ?? mineDescription(page.content) ?? undefined;
  const canonical = absoluteUrl(
    pageNumber > 1 ? childPath(path, `pagina/${pageNumber}`) : path
  );
  const noIndex = (seo?.noIndex ?? false) || isGatedRoute(route);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: ogImages(seo?.ogImage ?? firstHeroImage(page.content)),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const path = "/" + (slug ?? []).join("/");

  const resolved = await resolvePath(path);

  switch (resolved.kind) {
    case "page":
      return pageMetadata(resolved.data, resolved.path);
    case "paginated-list":
      // pageNumber 1 falls back to the plain-page shape (`/pagina/1`
      // redirects to the parent path, so it is described as the parent).
      return pageMetadata(resolved.data, resolved.path, resolved.pageNumber);
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await props.params;
  const path = "/" + (slug ?? []).join("/");

  const resolved = await resolvePath(path);

  switch (resolved.kind) {
    case "page": {
      // Spec B — "Server Component Visibility Enforcement"
      // Proxy does no auth; this is the authoritative CMS-driven gate.
      await enforceRouteAccess(resolved.data.route!);
      return renderPage(resolved.data, resolved.path, 1);
    }

    case "paginated-list": {
      // Page 1 is canonical at the parent path itself.
      if (resolved.pageNumber === 1) redirect(resolved.path);

      // Virtual pages inherit the parent route's visibility/role gate.
      await enforceRouteAccess(resolved.data.route!);
      return renderPage(resolved.data, resolved.path, resolved.pageNumber);
    }

    default:
      notFound();
  }
}

/**
 * Renders a resolved SDUI page inside its layout. `pageNumber` > 1 only for
 * the `/pagina/{n}` virtual child paths (BlockRenderer injects it into every
 * block; article-list paginates on it).
 */
function renderPage(data: PageQueryResult, path: string, pageNumber: number) {
  const page = data.route!.page!;
  const { layout, content } = page;
  const { navbar, footer } = data;

  // A11y: los bloques hero emiten el h1; una página sin hero quedaba sin h1
  // (jerarquía rota para lectores de pantalla). El título del CMS lo cubre.
  const hasHeroH1 = content.some(
    (b) => b.__component === "blocks.hero-landing" || b.__component === "blocks.hero-page"
  );
  const srTitle = hasHeroH1 ? null : <h1 className="sr-only">{page.title}</h1>;

  if (layout === "full-width") {
    return (
      <FullWidthLayout navbar={navbar} footer={footer}>
        {srTitle}
        <BlockRenderer blocks={content} pagePath={path} pageNumber={pageNumber} />
      </FullWidthLayout>
    );
  }

  return (
    <DefaultLayout navbar={navbar} footer={footer}>
      {srTitle}
      <BlockRenderer blocks={content} pagePath={path} pageNumber={pageNumber} />
    </DefaultLayout>
  );
}
