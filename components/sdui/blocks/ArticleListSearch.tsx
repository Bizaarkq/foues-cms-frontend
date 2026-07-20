"use client";

/**
 * ArticleListSearch — search box of the article-list block.
 *
 * Unlike the document repository and magazine archive (whole list already
 * in the page → pure client filtering), articles are PAGINATED server-side
 * (path-based /pagina/{n} ISR entries), so filtering the visible page
 * would silently miss everything else. Instead this queries
 * /api/articles/search (Strapi containsi on the title) — debounced,
 * minimum 2 characters, aborting stale requests — and shows matches as a
 * compact link list above the grid. The grid itself never changes.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { BlockSearchInput } from "@/components/sdui/BlockSearchInput";

interface SearchResult {
  title: string;
  slug: string;
  dateLabel: string | null;
}

/** Each state carries the query it belongs to — stale states are simply not rendered. */
type SearchState =
  | { status: "idle" }
  | { status: "loading"; q: string }
  | { status: "done"; q: string; results: SearchResult[] }
  | { status: "error"; q: string };

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function ArticleListSearch() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) return;

    // All setState calls live inside the debounce callback (async boundary),
    // never in the effect body — React Compiler cascading-render rule.
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState({ status: "loading", q });
      fetch(`/api/articles/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<{ results: SearchResult[] }>;
        })
        .then((data) => setState({ status: "done", q, results: data.results }))
        .catch(() => {
          if (!controller.signal.aborted) setState({ status: "error", q });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Only the state matching the CURRENT query renders — anything else is stale.
  const q = query.trim();
  const current =
    q.length >= MIN_QUERY_LENGTH && state.status !== "idle" && state.q === q
      ? state
      : null;

  return (
    <div className="mb-8 flex flex-col gap-3">
      <BlockSearchInput
        value={query}
        onChange={setQuery}
        label="Buscar artículos"
        placeholder="Buscar artículos por título"
      />

      {current?.status === "loading" && (
        <p
          className="flex items-center gap-2 text-sm"
          style={{ color: "var(--color-foues-text-muted)" }}
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Buscando…
        </p>
      )}

      {current?.status === "error" && (
        <p className="text-sm" style={{ color: "var(--color-foues-text-muted)" }}>
          No se pudo completar la búsqueda. Intentá de nuevo.
        </p>
      )}

      {current?.status === "done" && (
        <div aria-live="polite">
          {current.results.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-foues-text-muted)" }}>
              No se encontraron artículos para &ldquo;{q}&rdquo;.
            </p>
          ) : (
            <>
              <p
                className="mb-2 text-sm font-semibold"
                style={{ color: "var(--color-foues-navy)" }}
              >
                {current.results.length}{" "}
                {current.results.length === 1
                  ? "resultado encontrado"
                  : "resultados encontrados"}{" "}
                para &ldquo;{q}&rdquo;
              </p>
              <ul
                className="divide-y rounded border bg-[var(--color-foues-surface-raised)] shadow-sm"
                style={{ borderColor: "var(--color-foues-border-subtle)" }}
              >
              {current.results.map((result) => (
                <li key={result.slug} className="border-[var(--color-foues-border-subtle)]">
                  <Link
                    href={`/articulos/${result.slug}`}
                    className="flex items-baseline justify-between gap-4 px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-foues-accent)] motion-safe:transition-colors hover:bg-[color-mix(in_srgb,var(--color-foues-accent)_5%,transparent)]"
                  >
                    <span
                      className="min-w-0 truncate text-sm font-semibold"
                      style={{ color: "var(--color-foues-text-base)" }}
                    >
                      {result.title}
                    </span>
                    {result.dateLabel && (
                      <span
                        className="hidden shrink-0 text-xs sm:inline"
                        style={{ color: "var(--color-foues-text-muted)" }}
                      >
                        {result.dateLabel}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
