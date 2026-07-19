/**
 * proxy.ts — Next.js 16 proxy (previously middleware.ts).
 *
 * Responsibility: Server-Action rate limiter.
 * Limits POST requests carrying the next-action header to 5 per minute per IP.
 *
 * Auth enforcement lives in the Server Component (app/[[...slug]]/page.tsx)
 * after getPageByPath() resolves route.visibility from Strapi.
 */

import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Rate limiter state (Server Actions only)
// ---------------------------------------------------------------------------

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 5;
const timestamps = new Map<string, number[]>();
let lastCleanup = 0;

/** Drops IPs with no requests inside the window — otherwise the map grows for
 *  as long as the process lives (one entry per distinct client IP ever seen). */
function pruneStaleIps(windowStart: number): void {
  for (const [ip, times] of timestamps) {
    const alive = times.filter((t) => t > windowStart);
    if (alive.length === 0) {
      timestamps.delete(ip);
    } else {
      timestamps.set(ip, alive);
    }
  }
}

// ---------------------------------------------------------------------------
// Proxy function
// ---------------------------------------------------------------------------

export function proxy(request: NextRequest): NextResponse {
  // --- Rate limiter (Server Actions only) ---
  const isServerAction =
    request.method === 'POST' && request.headers.has('next-action');

  if (isServerAction) {
    // Use the RIGHTMOST x-forwarded-for hop, not the leftmost: the leftmost
    // value is whatever the client sent and is trivially spoofable (an
    // attacker can rotate fake XFF values to evade the 5/min cap — notably
    // relevant now that Server Actions accept bodies up to 16 MB). The
    // rightmost value is appended by our own trusted reverse proxy and
    // cannot be forged by the client.
    const ip =
      request.headers.get('x-forwarded-for')?.split(',').pop()?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    const now = Date.now();
    const windowStart = now - RATE_WINDOW_MS;

    // Amortised cleanup: at most once per window, O(ips) — keeps the map
    // bounded by the number of IPs active in the last minute.
    if (now - lastCleanup > RATE_WINDOW_MS) {
      lastCleanup = now;
      pruneStaleIps(windowStart);
    }

    const reqs = (timestamps.get(ip) ?? []).filter((t) => t > windowStart);

    if (reqs.length >= RATE_MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    reqs.push(now);
    timestamps.set(ip, reqs);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all paths except static files and images (Next.js internals).
    // Auth exemption logic is handled inside the proxy function above.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
