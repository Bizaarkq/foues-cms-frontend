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
const STRAPI_PUBLIC_URL = process.env.STRAPI_PUBLIC_URL || STRAPI_URL;
const STRAPI_API_TOKEN = required("STRAPI_API_TOKEN", process.env.STRAPI_API_TOKEN);
const FORM_SUBMIT_TOKEN = required("FORM_SUBMIT_TOKEN", process.env.FORM_SUBMIT_TOKEN);
const AUTH_SECRET = required("AUTH_SECRET", process.env.AUTH_SECRET);
const AUTH_URL = required("AUTH_URL", process.env.AUTH_URL ?? process.env.NEXTAUTH_URL);
const GOOGLE_CLIENT_ID = required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
const GOOGLE_CLIENT_SECRET = required("GOOGLE_CLIENT_SECRET", process.env.GOOGLE_CLIENT_SECRET);
const REVALIDATE_SECRET = required("REVALIDATE_SECRET", process.env.REVALIDATE_SECRET);

const MAGAZINE_TRACK_TOKEN = required("MAGAZINE_TRACK_TOKEN", process.env.MAGAZINE_TRACK_TOKEN);

const SITE_USER_TOKEN = required("SITE_USER_TOKEN", process.env.SITE_USER_TOKEN);

// Opcional — URL del Campus Virtual en la barra superior del navbar.
// Sin valor, el link no se renderiza.
const CAMPUS_VIRTUAL_URL = process.env.CAMPUS_VIRTUAL_URL || null;

const parsed = new URL(STRAPI_URL);
const protocol = parsed.protocol.replace(":", "") as "http" | "https";
const hostname = parsed.hostname;
const port = parsed.port || (protocol === "https" ? "443" : "80");

export const isDev = process.env.NODE_ENV === "development";

export const env = {
  strapi: {
    url: STRAPI_URL,
    publicUrl: STRAPI_PUBLIC_URL,
    token: STRAPI_API_TOKEN,
    formSubmitToken: FORM_SUBMIT_TOKEN,
    protocol,
    hostname,
    port,
  },
  auth: {
    secret: AUTH_SECRET,
    url: AUTH_URL,
    googleId: GOOGLE_CLIENT_ID,
    googleSecret: GOOGLE_CLIENT_SECRET,
  },
  revalidateSecret: REVALIDATE_SECRET,
  magazineTrackToken: MAGAZINE_TRACK_TOKEN,
  siteUserToken: SITE_USER_TOKEN,
  campusVirtualUrl: CAMPUS_VIRTUAL_URL,
} as const;
