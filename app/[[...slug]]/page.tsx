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

import { notFound } from "next/navigation";
import { getPageByPath } from "@/lib/strapi";
import { DefaultLayout } from "@/components/sdui/layouts/DefaultLayout";
import { FullWidthLayout } from "@/components/sdui/layouts/FullWidthLayout";
import { BlockRenderer } from "@/components/sdui/BlockRenderer";

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await props.params;
  const path = "/" + (slug?.join("/") ?? "");

  const data = await getPageByPath(path);

  if (!data?.route?.page) {
    notFound();
  }

  const { route, navbar, footer } = data;
  const { layout, content } = route.page;

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
