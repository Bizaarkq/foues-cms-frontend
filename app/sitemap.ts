/**
 * sitemap.ts — programmatic sitemap (Next.js metadata file convention).
 *
 * Entries: home + every public/active CMS page route + every published
 * article. Magazine edition URLs are deliberately excluded in v1 — they are
 * discoverable through their archive pages. Non-public routes (requires-login
 * or role-gated) are filtered out by getIndexableRoutes().
 */

import type { MetadataRoute } from "next";
import { getIndexableRoutes, getSitemapArticles } from "@/lib/strapi";
import { absoluteUrl } from "@/lib/seo";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [routes, articles] = await Promise.all([
    getIndexableRoutes(),
    getSitemapArticles(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  // Home first — skipped when the routes list already contains "/" (dedupe).
  if (!routes.some((route) => route.path === "/")) {
    entries.push({ url: env.siteUrl, priority: 1 });
  }

  for (const route of routes) {
    entries.push({
      url: route.path === "/" ? env.siteUrl : absoluteUrl(route.path),
      ...(route.lastModified ? { lastModified: route.lastModified } : {}),
      ...(route.path === "/" ? { priority: 1 } : {}),
    });
  }

  for (const article of articles) {
    entries.push({
      url: absoluteUrl(`/articulos/${article.slug}`),
      ...(article.lastModified ? { lastModified: article.lastModified } : {}),
    });
  }

  return entries;
}
