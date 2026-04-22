/**
 * lib/env.ts — módulo de entorno unificado.
 * REQ-ENV: único lugar que lee process.env. Falla temprano si falta algo.
 * Importable desde next.config.ts Y desde RSC. Las variables NO llevan
 * prefijo NEXT_PUBLIC_ — usar sólo desde código server.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value;
}

const STRAPI_URL = required("STRAPI_URL", process.env.STRAPI_URL);
const STRAPI_API_TOKEN = required("STRAPI_API_TOKEN", process.env.STRAPI_API_TOKEN);

const parsed = new URL(STRAPI_URL);
const protocol = parsed.protocol.replace(":", "") as "http" | "https";
const hostname = parsed.hostname;
const port = parsed.port || (protocol === "https" ? "443" : "80");

export const env = {
  strapi: {
    url: STRAPI_URL,
    token: STRAPI_API_TOKEN,
    protocol,
    hostname,
    port,
  },
} as const;
