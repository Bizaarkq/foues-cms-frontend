/**
 * GET /api/documents/[documentId]
 *
 * Token-holding download proxy for the role-gated document repository
 * (stage 1, read-only — design doc §"Downloads: token-holding proxy").
 * The browser never sees the real Strapi `/uploads/*` URL: this route
 * validates the session + category role gate, then streams the file
 * server-to-server with the shared `x-document-access-secret` header the
 * CMS middleware requires for protected media.
 *
 * `params` is a Promise in Next.js 16 (dynamic segments) — must be awaited.
 * Source: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md
 *
 * Route Handlers are dynamic by default, but `force-dynamic` documents that
 * intent explicitly (this route must never be statically cached — every
 * request needs a fresh session + role check).
 */

import { after } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

interface StrapiFile {
  url: string;
  name: string;
  mime: string;
  size: number | null;
}

interface StrapiRole {
  key: string | null;
}

interface StrapiCategory {
  allowed_roles: StrapiRole[] | null;
}

interface StrapiDocument {
  documentId: string;
  title: string;
  file: StrapiFile | null;
  category: StrapiCategory | null;
}

interface StrapiDocumentResponse {
  data: StrapiDocument | null;
}

/** application/pdf is the only accepted mime in v1 (design doc, out of scope: non-PDF). */
function extensionFromMime(mime: string): string {
  return mime === "application/pdf" ? ".pdf" : "";
}

/** Falls back to the document title (+ mime-derived extension) when the file has no name. */
function resolveFilename(file: StrapiFile, title: string): string {
  if (file.name && file.name.trim() !== "") return file.name;
  return `${title}${extensionFromMime(file.mime)}`;
}

/**
 * Builds a Content-Disposition header value, sanitised against header
 * injection (quotes/control chars stripped) with an RFC 5987 `filename*`
 * fallback for non-ASCII titles.
 */
function buildContentDisposition(rawFilename: string): string {
  const cleaned = rawFilename.replace(/["\r\n\x00-\x1f\x7f]/g, "").trim() || "documento";
  const asciiFallback = cleaned.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(cleaned);
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/**
 * Logs a download to `document-download`. Called via `after()` so it never
 * delays or can fail the file response (magazine-track precedent:
 * app/api/magazine-track/route.ts — awaited-fetch-in-try/catch shape, but
 * dispatched post-response here since the file stream, not this log call,
 * is the thing the client is waiting on).
 */
async function logDownload(
  documentId: string,
  userEmail: string | null,
  userName: string | null
): Promise<void> {
  try {
    const res = await fetch(`${env.strapi.url}/api/document-downloads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.documentToken}`,
      },
      body: JSON.stringify({
        data: {
          document: documentId,
          user_email: userEmail,
          user_name: userName,
          downloaded_at: new Date().toISOString(),
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "(unreadable)");
      console.error(`[documents] download log POST failed: HTTP ${res.status} — ${text}`);
    }
  } catch (err) {
    console.error("[documents] download log request failed:", err);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
): Promise<Response> {
  const { documentId } = await params;

  const session = await auth();
  if (!session) redirect("/login");

  let doc: StrapiDocument | null = null;
  try {
    const res = await fetch(
      `${env.strapi.url}/api/documents/${encodeURIComponent(documentId)}` +
        `?populate[file]=true&populate[category][populate][allowed_roles]=true`,
      {
        headers: { Authorization: `Bearer ${env.documentToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      return new Response("Documento no encontrado.", { status: 404 });
    }

    const json = (await res.json()) as StrapiDocumentResponse;
    doc = json.data;
  } catch (err) {
    console.error(`[documents] Failed to fetch document metadata for ${documentId}:`, err);
    return new Response("Documento no encontrado.", { status: 404 });
  }

  if (!doc || !doc.file) {
    return new Response("Documento no encontrado.", { status: 404 });
  }

  // Role gate — empty allowed_roles = any logged-in user. A mismatch is a
  // plain 404, never 403: the route must not reveal that the document exists
  // (design doc §"Downloads: token-holding proxy", step 3).
  const allowedRoles = (doc.category?.allowed_roles ?? []).flatMap((r) =>
    r.key ? [r.key] : []
  );
  if (allowedRoles.length > 0) {
    const roleKey = session.user?.role?.key ?? null;
    if (roleKey === null || !allowedRoles.includes(roleKey)) {
      return new Response("Documento no encontrado.", { status: 404 });
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${env.strapi.url}${doc.file.url}`, {
      headers: { "x-document-access-secret": env.documentAccessSecret },
      cache: "no-store",
      // Upper bound covering the whole streamed response body (not a connect
      // timeout) — large PDFs need time to stream fully through this proxy.
      // 15 minutes (up from 5) to match the new 500 MB upload ceiling: a
      // file that large can legitimately take a while to stream back down
      // to a reader on a slow connection.
      signal: AbortSignal.timeout(900_000),
    });
  } catch (err) {
    console.error(`[documents] Failed to fetch file from Strapi for ${documentId}:`, err);
    return new Response("No se pudo descargar el archivo.", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    console.error(
      `[documents] Strapi file fetch for ${documentId} returned HTTP ${upstream.status}`
    );
    return new Response("No se pudo descargar el archivo.", { status: 502 });
  }

  // Fire-and-forget download log AFTER deciding to serve — a logging failure
  // must never affect the response already committed to streaming the file.
  after(() =>
    logDownload(documentId, session.user?.email ?? null, session.user?.name ?? null)
  );

  const filename = resolveFilename(doc.file, doc.title);
  const headers = new Headers();
  headers.set("Content-Type", doc.file.mime || "application/octet-stream");
  // doc.file.size (Strapi's `size` attribute) is in KILOBYTES, not bytes —
  // using it directly would understate Content-Length by ~1024x and corrupt
  // every download. Only trust the upstream response's own Content-Length.
  const upstreamLength = upstream.headers.get("content-length");
  if (upstreamLength !== null) headers.set("Content-Length", upstreamLength);
  headers.set("Content-Disposition", buildContentDisposition(filename));

  return new Response(upstream.body, { status: 200, headers });
}
