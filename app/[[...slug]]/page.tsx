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
 *   3. No route → 404. Route with no page → 404.
 *   4. Select layout wrapper based on page.layout enum.
 *   5. BlockRenderer dispatches each block to its registered stub component.
 */

import { notFound, redirect } from "next/navigation";
import { getPageByPath } from "@/lib/strapi";
import { auth } from "@/lib/auth";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import { FullWidthLayout } from "@/components/sdui/layouts/FullWidthLayout";
import { BlockRenderer } from "@/components/sdui/BlockRenderer";
import { MagazineViewer } from "@/components/magazine/MagazineViewer";

// Matches /quienes-somos/revista/{slug} — one path segment, no trailing slash.
// Routed before the generic notFound() so that magazine edition URLs that have
// no Strapi route record are handled by MagazineViewer instead of 404ing.
const MAGAZINE_VIEWER_RE = /^\/quienes-somos\/revista\/([^/]+)$/;

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await props.params;
  const path = "/" + (slug?.join("/") ?? "");

  const data = await getPageByPath(path);

  // Hard failure: Strapi request returned nothing at all
  if (!data) {
    notFound();
  }

  // Magazine viewer route — checked before generic 404 so that edition URLs
  // that have no Strapi route record are handled by the viewer, not by 404.
  if (!data.route || !data.route.page) {
    const magazineMatch = MAGAZINE_VIEWER_RE.exec(path);
    if (magazineMatch) {
      return (
        <MagazineViewer
          slug={magazineMatch[1]}
          navbar={data.navbar}
          footer={data.footer}
        />
      );
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

  if (layout === "full-width") {
    return (
      <FullWidthLayout navbar={navbar} footer={footer}>
        <BlockRenderer blocks={content} />
      </FullWidthLayout>
    );
  }

  return (
    <DefaultLayout navbar={navbar} footer={footer}>
      <BlockRenderer blocks={content} />
    </DefaultLayout>
  );
}
