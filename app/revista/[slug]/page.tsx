/**
 * Magazine edition viewer — fixed route /revista/{slug} (segment in Spanish,
 * es-SV site).
 *
 * Replaces the derived `{archive-page-path}/{slug}` URLs (removed from the
 * catch-all): editions are public by design, gated only on conversionStatus
 * "ready" + published — like /articulos, no visibility/role inheritance.
 * "revista" is a reserved path segment: this static route shadows the
 * [[...slug]] catch-all, and the CMS rejects routes using reserved first
 * segments (see route validation in foues-cms-api).
 *
 * `params` is a Promise in Next.js 16 — must be awaited (page.md file convention).
 * Navbar/footer come from getPageByPath("/") — the unified query returns them
 * for any path, reusing the home cache entry.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPageByPath } from "@/lib/strapi";
import { getCachedMagazineIssue } from "@/lib/cached";
import { absoluteUrl, truncateDescription } from "@/lib/seo";
import { mediaUrl } from "@/lib/media";
import { MagazineViewer } from "@/components/magazine/MagazineViewer";

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  // Same React.cache entry the viewer consumes — one Strapi round-trip.
  const issue = await getCachedMagazineIssue(slug);
  if (!issue || issue.conversionStatus !== "ready" || !issue.publishedAt) {
    return {};
  }

  const description = issue.description
    ? truncateDescription(issue.description)
    : undefined;
  const canonical = absoluteUrl(`/revista/${slug}`);
  const coverUrl = mediaUrl(issue.cover);

  return {
    title: issue.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: issue.title,
      description,
      url: canonical,
      type: "website",
      images: coverUrl
        ? [
            {
              url: coverUrl,
              ...(issue.cover?.alternativeText
                ? { alt: issue.cover.alternativeText }
                : {}),
              ...(issue.cover?.width != null ? { width: issue.cover.width } : {}),
              ...(issue.cover?.height != null
                ? { height: issue.cover.height }
                : {}),
            },
          ]
        : undefined,
    },
  };
}

export default async function MagazineEditionPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const chrome = await getPageByPath("/");
  if (!chrome) notFound();

  // MagazineViewer re-reads the cached issue and 404s when it is missing,
  // not ready, or unpublished.
  return <MagazineViewer slug={slug} navbar={chrome.navbar} footer={chrome.footer} />;
}
