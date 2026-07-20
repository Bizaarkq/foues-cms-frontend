/**
 * GET /api/articles/search?q=… — public quick-search over published articles.
 *
 * Backs the search box of the article-list block. Articles are public
 * content (indexable, in the sitemap), so this endpoint exposes nothing
 * gated — it only narrows what any visitor could already browse. The
 * Strapi read token stays server-side (searchArticles → gql), and results
 * ride a 5-minute ISR cache per distinct query.
 *
 * Rate-limited in-memory per IP (same trusted-hop XFF rationale as
 * proxy.ts, which only covers Server Actions): typing bursts are fine,
 * unique-query floods against Strapi are not.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchArticles, type ArticleSearchHit } from "@/lib/strapi";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQUESTS = 30;
const timestamps = new Map<string, number[]>();
let lastCleanup = 0;

function isRateLimited(request: NextRequest): boolean {
  // Rightmost XFF hop: appended by our reverse proxy, not client-forgeable.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;

  if (now - lastCleanup > RATE_WINDOW_MS) {
    lastCleanup = now;
    for (const [key, times] of timestamps) {
      const alive = times.filter((t) => t > windowStart);
      if (alive.length === 0) timestamps.delete(key);
      else timestamps.set(key, alive);
    }
  }

  const reqs = (timestamps.get(ip) ?? []).filter((t) => t > windowStart);
  if (reqs.length >= RATE_MAX_REQUESTS) return true;

  reqs.push(now);
  timestamps.set(ip, reqs);
  return false;
}

/** es-SV date chip: event_date for events, publishedAt otherwise (ArticleList pattern). */
function formatDateLabel(hit: ArticleSearchHit): string | null {
  const iso =
    hit.category === "event" && hit.event_date ? hit.event_date : hit.publishedAt;
  if (!iso) return null;
  return new Intl.DateTimeFormat("es-SV", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export async function GET(request: NextRequest) {
  if (isRateLimited(request)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const q = (request.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < MIN_QUERY_LENGTH || q.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  const hits = await searchArticles(q);
  const results = hits
    .filter((hit): hit is ArticleSearchHit & { slug: string } => hit.slug !== null)
    .map((hit) => ({
      title: hit.Title,
      slug: hit.slug,
      dateLabel: formatDateLabel(hit),
    }));

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, max-age=60" } }
  );
}
