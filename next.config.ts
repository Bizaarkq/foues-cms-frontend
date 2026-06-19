import type { NextConfig } from "next";

/**
 * next.config.ts runs at build time — lib/env.ts is intentionally NOT imported
 * here because it validates all runtime vars (AUTH_SECRET, GOOGLE_*, etc.) eagerly
 * and those are unavailable during `docker build`. Only STRAPI_URL is a build arg.
 *
 * REQ-CFG-1: remotePatterns derived from STRAPI_URL directly.
 * unoptimized in dev: Next.js 15+ blocks private IPs in the image optimizer.
 */
const strapiUrl = process.env.STRAPI_URL ?? "http://localhost:1337";
const parsed = new URL(strapiUrl);
const protocol = parsed.protocol.replace(":", "") as "http" | "https";
const hostname = parsed.hostname;
const port = parsed.port || (protocol === "https" ? "443" : "80");
const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: isDev,
    remotePatterns: [
      {
        protocol,
        hostname,
        port,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
