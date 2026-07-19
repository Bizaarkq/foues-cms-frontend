/**
 * POST /api/documents/upload-ticket
 *
 * Ticket-issuance route for stage-2 document-repository uploads — replaces
 * the old streaming route handler (app/api/documents/upload/route.ts,
 * deleted in this same change) that piped the raw multipart body through
 * this app to the CMS.
 *
 * New design: this app issues a short-lived, single-use upload ticket
 * (session + role validated here, exactly as before) by calling the CMS's
 * `POST {STRAPI_URL}/api/documents/upload-tickets`. The BROWSER then uploads the
 * file DIRECTLY to the CMS via XHR against the returned `uploadUrl` — this
 * app never touches file bytes at all, on either hop. See
 * `components/sdui/blocks/DocumentUploadForm.tsx` for the client side of
 * this contract.
 *
 * This route's own body is a tiny JSON payload (`{ categoryId, title }`),
 * so none of the previous route's streaming/Content-Length/duplex machinery
 * applies here — it's a plain JSON route handler.
 */

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDocumentCategoryForUpload, getSiteSettings } from "@/lib/strapi";
import { canUploadToCategory } from "@/lib/document-upload-rule";
import { mapUploadError } from "@/lib/document-upload-messages";

// Route Handlers are dynamic by default; declared explicitly since this one
// must never be cached (fresh session + fresh permission check every call).
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Rate limiter (this route only) — same in-memory sliding-window pattern as
// the deleted streaming route (and proxy.ts's Server Action limiter),
// duplicated locally. Ticket issuance — not the file transfer itself, which
// now goes straight browser→CMS and this app never sees — is the throttled
// step: an attacker spamming this endpoint can only mint unused tickets, not
// push bytes through this process.
// ---------------------------------------------------------------------------
const RATE_WINDOW_MS = 5 * 60_000;
const RATE_MAX_REQUESTS = 5;
const uploadTimestamps = new Map<string, number[]>();
let lastCleanup = 0;

function pruneStaleIps(windowStart: number): void {
  for (const [ip, times] of uploadTimestamps) {
    const alive = times.filter((t) => t > windowStart);
    if (alive.length === 0) {
      uploadTimestamps.delete(ip);
    } else {
      uploadTimestamps.set(ip, alive);
    }
  }
}

/** Rightmost x-forwarded-for hop — the leftmost value is client-supplied and trivially spoofable. */
function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;

  if (now - lastCleanup > RATE_WINDOW_MS) {
    lastCleanup = now;
    pruneStaleIps(windowStart);
  }

  const reqs = (uploadTimestamps.get(ip) ?? []).filter((t) => t > windowStart);
  if (reqs.length >= RATE_MAX_REQUESTS) return true;

  reqs.push(now);
  uploadTimestamps.set(ip, reqs);
  return false;
}

interface TicketIssueResult {
  ok: boolean;
  error?: string;
  uploadUrl?: string;
  expiresAt?: string;
}

function result(body: TicketIssueResult, status: number): Response {
  return Response.json(body, { status });
}

interface CmsTicketResponse {
  ok?: boolean;
  ticket?: string;
  expiresAt?: string;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  // --- 1. Auth FIRST — before anything about the body is read or touched. ---
  const session = await auth();
  if (!session) {
    return result({ ok: false, error: "Debes iniciar sesión para subir documentos." }, 401);
  }

  // --- 2. Rate limit (per IP) — cheap, still before touching the body. ---
  if (isRateLimited(clientIp(request))) {
    return result(
      { ok: false, error: "Demasiadas subidas. Espera unos minutos e inténtalo de nuevo." },
      429
    );
  }

  // --- 3. Parse the JSON body: { categoryId, title }. ---
  let body: { categoryId?: unknown; title?: unknown };
  try {
    body = await request.json();
  } catch {
    return result({ ok: false, error: "Solicitud inválida." }, 400);
  }

  const categoryId = typeof body.categoryId === "string" ? body.categoryId.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (categoryId === "") {
    return result({ ok: false, error: "Categoría inválida." }, 400);
  }
  if (title.length < 1 || title.length > 200) {
    return result({ ok: false, error: "El título debe tener entre 1 y 200 caracteres." }, 400);
  }

  // --- 4. Authoritative permission re-check (submit-form trust model): ---
  // never trust that the button the client saw was actually gated
  // correctly — re-fetch the category fresh and re-validate against the
  // session role.
  const category = await getDocumentCategoryForUpload(categoryId);
  if (!category) {
    return result({ ok: false, error: "Categoría inválida." }, 400);
  }
  const roleKey = session.user?.role?.key ?? null;
  if (!canUploadToCategory(category, roleKey)) {
    // Generic message — never reveal category upload config to a session
    // that isn't allowed to upload.
    return result(
      { ok: false, error: "No tienes permiso para subir documentos en esta categoría." },
      403
    );
  }

  // --- 5. Ask the CMS to issue a one-time upload ticket. ---
  let res: Response;
  try {
    res = await fetch(`${env.strapi.url}/api/documents/upload-tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.documentToken}`,
      },
      body: JSON.stringify({
        category: categoryId,
        title,
        uploaded_by_name: session.user?.name ?? "",
        uploaded_by_email: session.user?.email ?? "",
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    console.error("[documents/upload-ticket] ticket issuance request failed:", err);
    return result(
      { ok: false, error: "Error de red al preparar la subida. Inténtalo de nuevo." },
      502
    );
  }

  let cmsJson: CmsTicketResponse | null = null;
  try {
    cmsJson = await res.json();
  } catch {
    cmsJson = null;
  }

  if (!res.ok || !cmsJson?.ok) {
    console.error(
      `[documents/upload-ticket] CMS ticket issuance failed: HTTP ${res.status} — ${JSON.stringify(cmsJson)}`
    );
    const { maxUploadMb } = await getSiteSettings();
    return result(
      { ok: false, error: mapUploadError(cmsJson?.error, maxUploadMb) },
      res.status >= 400 && res.status < 600 ? res.status : 502
    );
  }

  // --- 6. Success — hand the browser a URL it can reach directly. ---
  // env.strapi.publicUrl (browser-facing), NOT env.strapi.url (internal
  // server-to-server): the browser uploads straight to the CMS from here on,
  // this app never sees the file bytes.
  return result(
    {
      ok: true,
      uploadUrl: `${env.strapi.publicUrl}/api/documents/upload/${cmsJson.ticket}`,
      expiresAt: cmsJson.expiresAt,
    },
    200
  );
}
