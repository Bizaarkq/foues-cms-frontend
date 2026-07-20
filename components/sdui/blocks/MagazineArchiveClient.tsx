"use client";

/**
 * MagazineArchiveClient — browser side of the magazine archive block.
 *
 * Receives the ready + published editions already resolved to serialisable
 * data by the RSC (cover URLs made absolute server-side) and renders the
 * cover-card grid with a client-side search box: editions filter by title
 * or edition number, case- and accent-insensitive. No extra fetches — the
 * archive is fully loaded, searching only narrows what is shown.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, SearchX } from "lucide-react";
import { matchesSearch } from "@/lib/search";
import { BlockSearchInput } from "@/components/sdui/BlockSearchInput";
import { EmptyState } from "@/components/sdui/EmptyState";

export interface ArchiveIssue {
  documentId: string;
  slug: string;
  title: string;
  number: number | null;
  date: string | null;
  coverUrl: string | null;
}

export function MagazineArchiveClient({ issues }: { issues: ArchiveIssue[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim();
  const filtered = q
    ? issues.filter(
        (issue) =>
          matchesSearch(issue.title, q) ||
          (issue.number !== null && matchesSearch(`edición ${issue.number}`, q))
      )
    : issues;

  return (
    <div className="flex flex-col gap-6">
      <BlockSearchInput
        value={query}
        onChange={setQuery}
        label="Buscar ediciones"
        placeholder="Buscar por título o número de edición"
      />

      {q && filtered.length > 0 && (
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--color-foues-navy)" }}
          aria-live="polite"
        >
          {filtered.length} {filtered.length === 1 ? "edición encontrada" : "ediciones encontradas"}{" "}
          para &ldquo;{q}&rdquo;
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={SearchX}
          message={`No se encontraron ediciones para "${q}".`}
        />
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((issue) => (
            <Link
              key={issue.documentId}
              href={`/revista/${issue.slug}`}
              className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] rounded"
            >
              <div className="bg-[var(--color-foues-surface-raised)] shadow-md overflow-hidden flex flex-col h-full transition-shadow group-hover:shadow-lg">
                {issue.coverUrl ? (
                  <div className="relative aspect-[3/4] w-full overflow-hidden shrink-0">
                    <Image
                      src={issue.coverUrl}
                      alt={`Portada de ${issue.title}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width:640px) 100vw, (max-width:768px) 50vw, (max-width:1280px) 33vw, 25vw"
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-[3/4] w-full shrink-0 flex items-center justify-center"
                    style={{ background: "var(--color-foues-surface-sunken)" }}
                    aria-hidden="true"
                  >
                    <BookOpen
                      className="h-16 w-16"
                      style={{ color: "var(--color-foues-text-muted)" }}
                    />
                  </div>
                )}

                <div className="p-4 flex flex-col gap-1">
                  {issue.number !== null && (
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--color-foues-text-muted)" }}
                    >
                      Edición {issue.number}
                    </span>
                  )}
                  <h3
                    className="font-bold text-sm leading-snug line-clamp-2"
                    style={{ color: "var(--color-foues-text-base)" }}
                  >
                    {issue.title}
                  </h3>
                  {issue.date && (
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-foues-text-secondary)" }}
                    >
                      {new Date(issue.date).toLocaleDateString("es-SV", {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
