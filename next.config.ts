import type { NextConfig } from "next";

/**
 * next.config.ts runs at build time — lib/env.ts is intentionally NOT imported
 * here because it validates all runtime vars (AUTH_SECRET, GOOGLE_*, etc.) eagerly
 * and those are unavailable during `docker build`. Only STRAPI_URL is a build arg.
 *
 * REQ-CFG-1: remotePatterns derived from STRAPI_URL (internal) and STRAPI_PUBLIC_URL
 * (browser-facing). Both are needed: next/image fetches from the internal URL
 * server-side, while media URLs sent to the client use the public URL.
 * unoptimized in dev: Next.js 15+ blocks private IPs in the image optimizer.
 */
function parseRemotePattern(url: string) {
  const parsed = new URL(url);
  const protocol = parsed.protocol.replace(":", "") as "http" | "https";
  const hostname = parsed.hostname;
  const port = parsed.port;
  return { protocol, hostname, port, pathname: "/uploads/**" as const };
}

const strapiUrl = process.env.STRAPI_URL ?? "http://localhost:1337";
const strapiPublicUrl = process.env.STRAPI_PUBLIC_URL ?? strapiUrl;
const isDev = process.env.NODE_ENV === "development";

const remotePatterns = [parseRemotePattern(strapiUrl)];
if (strapiPublicUrl !== strapiUrl) {
  remotePatterns.push(parseRemotePattern(strapiPublicUrl));
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: isDev,
    remotePatterns,
  },
  // No experimental.serverActions.bodySizeLimit override: the
  // document-repository upload never goes through a Server Action at all —
  // the browser gets a short-lived ticket from
  // app/api/documents/upload-ticket/route.ts (a small JSON exchange) and
  // then POSTs the file bytes straight to the CMS itself, bypassing this
  // app entirely. So Server Actions are back to Next's 1 MB default body
  // limit — shrinking the unauthenticated-buffer DoS surface back down
  // instead of leaving a 16 MB allowance around for actions that no longer
  // need it.
};

export default nextConfig;
