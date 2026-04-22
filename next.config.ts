import type { NextConfig } from "next";
import { env } from "./lib/env";

/**
 * next.config.ts
 *
 * REQ-ENV-4: process.env únicamente en lib/env.ts.
 * REQ-CFG-1: remotePatterns dinámico desde env.strapi.*.
 *
 * unoptimized en dev: Next.js 15+ bloquea IPs privadas (localhost → 127.0.0.1)
 * por seguridad SSRF en el optimizador de imágenes. En prod el optimizador
 * corre contra el host real de Strapi (IP pública, sin restricción).
 */

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    unoptimized: isDev,
    remotePatterns: [
      {
        protocol: env.strapi.protocol,
        hostname: env.strapi.hostname,
        port: env.strapi.port,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
