/**
 * Catch-all page renderer for SDUI routes.
 *
 * REQ-N01: [[...slug]] captures root "/" (slug undefined) and all nested paths.
 * REQ-N02: `params` is a Promise in Next.js 16 — must be awaited.
 *   Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md
 *
 * Data flow:
 *   1. Normalize slug → path string (e.g. ["posgrado","admision"] → "/posgrado/admision")
 *   2. getPageByPath(path) — single unified GraphQL query, cached 24h (Decision #9)
 *   3. No route → magazine-edition fallback (see below) → 404.
 *   4. Select layout wrapper based on page.layout enum.
 *   5. BlockRenderer dispatches each block to its registered component.
 *
 * Magazine-edition fallback (no hardcoded prefix):
 *   Edition URLs are `{path-of-the-page-holding-an-archive-block}/{issue-slug}`.
 *   When a path does not resolve to a route, we strip the last segment and
 *   resolve the parent page; if its content contains blocks.magazine-archive,
 *   the last segment is treated as an issue slug and MagazineViewer renders it,
 *   restricted to the publications selected on those blocks (none selected on
 *   any block = all publications allowed). The parent route's visibility gate
 *   applies to its editions too.
 *
 * Article pagination as virtual child:
 *   `{path-of-the-page-holding-an-article-list}/pagina/{n}` re-renders the
 *   parent page with `pageNumber` injected through BlockRenderer. Each page
 *   number is a distinct path (own ISR entry — no searchParams). n = 1 is
 *   canonical at the parent path itself, so `/pagina/1` redirects there.
 */

import { notFound, redirect } from "next/navigation";
import { getPageByPath } from "@/lib/strapi";
import { auth } from "@/lib/auth";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import { FullWidthLayout } from "@/components/sdui/layouts/FullWidthLayout";
import { BlockRenderer } from "@/components/sdui/BlockRenderer";
import { MagazineViewer } from "@/components/magazine/MagazineViewer";
import type { SDUIBlock, MagazineArchiveProps, SectionProps } from "@/types/blocks";
import type { PageQueryResult } from "@/types/page";

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

/**
 * Collects every block of a given __component in a page's content, including
 * those nested inside blocks.section groups (max depth 2 by design).
 */
function findBlocksByComponent<T>(blocks: SDUIBlock[], component: string): T[] {
  const found: T[] = [];
  for (const block of blocks) {
    if (block.__component === component) {
      found.push(block as T);
    } else if (block.__component === "blocks.section") {
      const section = block as unknown as SectionProps;
      for (const group of section.children ?? []) {
        found.push(...findBlocksByComponent<T>(group.blocks, component));
      }
    }
  }
  return found;
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await props.params;
  const segments = slug ?? [];
  const path = "/" + segments.join("/");

  const data = await getPageByPath(path);

  // Hard failure: Strapi request returned nothing at all
  if (!data) {
    notFound();
  }

  if (!data.route || !data.route.page) {
    // Article-pagination virtual child: `{parentPath}/pagina/{n}` re-renders
    // the parent page (if it holds an article-list block) with pageNumber n.
    if (segments.length >= 3 && segments[segments.length - 2] === "pagina") {
      const pageSegment = segments[segments.length - 1];
      const pageNumber = /^\d+$/.test(pageSegment) ? Number(pageSegment) : NaN;
      if (!Number.isInteger(pageNumber) || pageNumber < 1) notFound();

      const parentPath = "/" + segments.slice(0, -2).join("/");

      // Page 1 is canonical at the parent path itself.
      if (pageNumber === 1) redirect(parentPath);

      const parentData = await getPageByPath(parentPath);
      const parentPage = parentData?.route?.page;

      if (parentData?.route && parentPage) {
        const hasArticleList =
          findBlocksByComponent(parentPage.content, "blocks.article-list").length > 0;

        if (hasArticleList) {
          // Virtual pages inherit the parent route's visibility/role gate.
          await enforceRouteAccess(parentData.route);
          return renderPage(parentData, parentPath, pageNumber);
        }
      }

      notFound();
    }

    // Magazine-edition fallback: does the parent path hold an archive block?
    if (segments.length >= 2) {
      const editionSlug = segments[segments.length - 1];
      const parentPath = "/" + segments.slice(0, -1).join("/");
      const parentData = await getPageByPath(parentPath);
      const parentPage = parentData?.route?.page;

      if (parentData?.route && parentPage) {
        const archives = findBlocksByComponent<MagazineArchiveProps>(
          parentPage.content,
          "blocks.magazine-archive"
        );

        if (archives.length > 0) {
          // Editions inherit the archive page's visibility/role gate.
          await enforceRouteAccess(parentData.route);

          // Union of the publications selected across the page's archive
          // blocks; any block with no selection opens the door to all.
          const allowAll = archives.some(
            (a) => !a.publications || a.publications.length === 0
          );
          const allowedPublicationIds = allowAll
            ? null
            : [
                ...new Set(
                  archives.flatMap((a) =>
                    (a.publications ?? []).map((p) => p.documentId)
                  )
                ),
              ];

          return (
            <MagazineViewer
              slug={editionSlug}
              backHref={parentPath}
              allowedPublicationIds={allowedPublicationIds}
              navbar={parentData.navbar}
              footer={parentData.footer}
            />
          );
        }
      }
    }

    notFound();
  }

  // Spec B — "Server Component Visibility Enforcement"
  // Proxy does no auth; this is the authoritative CMS-driven gate.
  await enforceRouteAccess(data.route);

  return renderPage(data, path, 1);
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
