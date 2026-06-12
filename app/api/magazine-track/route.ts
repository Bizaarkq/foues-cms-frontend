/**
 * POST /api/magazine-track
 *
 * Proxy route: validates the tracking payload from FlipbookClient and
 * forwards it to the Strapi metrics endpoint as a server-to-server call
 * so that MAGAZINE_TRACK_TOKEN never reaches the browser.
 *
 * Expected request body:
 *   { documentId: string, type: "visit" | "depth", maxPercent?: number }
 *
 * Strapi-side endpoint (/api/magazine-issues/:documentId/track) lands in
 * slice 5. This proxy ships with the client that calls it so that the
 * browser-side code does not need to change in a later slice.
 *
 * Notes:
 *   - Route Handlers are dynamic by default in Next.js 16 (no static cache).
 *   - params is a Promise when present in dynamic segments (not used here).
 *   Source: node_modules/next/dist/docs/.../route.md
 */

import { env } from "@/lib/env";

export async function POST(request: Request): Promise<Response> {
  // --- Parse body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // --- Validate payload ---
  if (
    typeof body !== "object" ||
    body === null ||
    !("documentId" in body) ||
    !("type" in body)
  ) {
    return Response.json(
      { error: "Missing required fields: documentId, type" },
      { status: 400 }
    );
  }

  const { documentId, type, maxPercent } = body as Record<string, unknown>;

  if (typeof documentId !== "string" || documentId.trim() === "") {
    return Response.json({ error: "documentId must be a non-empty string" }, { status: 400 });
  }

  if (type !== "visit" && type !== "depth") {
    return Response.json({ error: "type must be 'visit' or 'depth'" }, { status: 400 });
  }

  if (type === "depth") {
    if (
      typeof maxPercent !== "number" ||
      !Number.isFinite(maxPercent) ||
      maxPercent < 0 ||
      maxPercent > 100
    ) {
      return Response.json(
        { error: "maxPercent must be a number between 0 and 100 for type 'depth'" },
        { status: 400 }
      );
    }
  }

  // --- Guard: token not configured ---
  const token = env.magazineTrackToken;
  if (!token) {
    // Slice 5 hasn't been deployed yet — silently accept without forwarding
    // so that client-side tracking calls don't surface errors to the reader.
    console.warn("[magazine-track] MAGAZINE_TRACK_TOKEN is not set; skipping proxy");
    return Response.json({ ok: true, forwarded: false });
  }

  // --- Forward to Strapi ---
  const strapiUrl = `${env.strapi.url}/api/magazine-issues/${encodeURIComponent(documentId)}/track`;
  const strapiPayload: Record<string, unknown> = { type };
  if (type === "depth") {
    strapiPayload.maxPercent = maxPercent;
  }

  try {
    const res = await fetch(strapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(strapiPayload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "(unreadable)");
      console.error(`[magazine-track] Strapi returned ${res.status}: ${text}`);
      // Do not expose Strapi errors to the client — return 200 to keep
      // the reader experience unaffected by backend tracking failures.
      return Response.json({ ok: true, forwarded: false });
    }

    return Response.json({ ok: true, forwarded: true });
  } catch (err) {
    console.error("[magazine-track] Strapi proxy request failed:", err);
    return Response.json({ ok: true, forwarded: false });
  }
}
