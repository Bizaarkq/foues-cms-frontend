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
 */

import { notFound, redirect } from "next/navigation";
import { getPageByPath } from "@/lib/strapi";
import { auth } from "@/lib/auth";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import { FullWidthLayout } from "@/components/sdui/layouts/FullWidthLayout";
import { BlockRenderer } from "@/components/sdui/BlockRenderer";
import { MagazineViewer } from "@/components/magazine/MagazineViewer";
import type { SDUIBlock, MagazineArchiveProps, SectionProps } from "@/types/blocks";

/**
 * Collects every blocks.magazine-archive in a page's content, including
 * those nested inside blocks.section groups (max depth 2 by design).
 */
function findMagazineArchiveBlocks(blocks: SDUIBlock[]): MagazineArchiveProps[] {
  const found: MagazineArchiveProps[] = [];
  for (const block of blocks) {
    if (block.__component === "blocks.magazine-archive") {
      found.push(block as MagazineArchiveProps);
    } else if (block.__component === "blocks.section") {
      const section = block as unknown as SectionProps;
      for (const group of section.children ?? []) {
        found.push(...findMagazineArchiveBlocks(group.blocks));
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
    // Magazine-edition fallback: does the parent path hold an archive block?
    if (segments.length >= 2) {
      const editionSlug = segments[segments.length - 1];
      const parentPath = "/" + segments.slice(0, -1).join("/");
      const parentData = await getPageByPath(parentPath);
      const parentPage = parentData?.route?.page;

      if (parentData?.route && parentPage) {
        const archives = findMagazineArchiveBlocks(parentPage.content);

        if (archives.length > 0) {
          // Editions inherit the archive page's visibility gate.
          const parentVisibility = parentData.route.visibility ?? "public";
          if (parentVisibility === "requires-login" && !(await auth())) {
            redirect("/login");
          }

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
  // Proxy does an O(1) cookie check; this is the authoritative CMS-driven gate.
  // null/undefined visibility is treated as 'public' (defaulted in strapi.ts mapper).
  const visibility = data.route.visibility ?? 'public';
  if (visibility === 'requires-login' && !(await auth())) {
    redirect('/login');
  }

  const page = data.route.page;
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
        <BlockRenderer blocks={content} pagePath={path} />
      </FullWidthLayout>
    );
  }

  return (
    <DefaultLayout navbar={navbar} footer={footer}>
      {srTitle}
      <BlockRenderer blocks={content} pagePath={path} />
    </DefaultLayout>
  );
}
