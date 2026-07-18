/**
 * robots.ts — robots.txt (Next.js metadata file convention).
 * API routes and the login page carry no indexable content.
 */

import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
