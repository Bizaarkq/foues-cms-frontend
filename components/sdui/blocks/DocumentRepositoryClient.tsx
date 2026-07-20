"use client";

/**
 * DocumentRepositoryClient — browser side of the document repository block.
 *
 * Receives the categories the session may see, already role-filtered by the
 * RSC (DocumentRepository.tsx). Upload-only categories arrive with an EMPTY
 * documents array — the read gate is enforced server-side and their list
 * data never reaches the browser.
 *
 * Owns the search box: documents filter by title across every readable
 * category (case- and accent-insensitive); a category whose NAME matches
 * shows its full list. Categories without matches collapse out of view
 * while a query is active. No fetches happen here — searching only narrows
 * the already-loaded lists, so the role gate cannot be bypassed by typing.
 *
 * Download links still point at the token-holding proxy
 * `/api/documents/{documentId}` (server re-validates the role gate).
 */

import { useState } from "react";
import { Download, SearchX } from "lucide-react";
import { matchesSearch } from "@/lib/search";
import { BlockSearchInput } from "@/components/sdui/BlockSearchInput";
import { EmptyState } from "@/components/sdui/EmptyState";
import DocumentUploadSection from "@/components/sdui/blocks/DocumentUploadSection";

// ---------------------------------------------------------------------------
// Serialisable props (built by the RSC)
// ---------------------------------------------------------------------------

export interface RepoClientDocument {
  documentId: string;
  title: string;
  publishedAt: string | null;
  /** Strapi file.size — KILOBYTES (float), null when unknown. */
  fileSize: number | null;
  hasFile: boolean;
}

export interface RepoClientCategory {
  documentId: string;
  name: string;
  description: string | null;
  canRead: boolean;
  canUpload: boolean;
  /** Always [] when !canRead — the RSC never sends gated list data. */
  documents: RepoClientDocument[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Formats a size as a short human-readable string, or null when unknown.
 * Strapi's `file.size` attribute is in KILOBYTES (float), not bytes.
 */
function formatFileSize(size: number | null): string | null {
  if (size === null || !Number.isFinite(size) || size <= 0) return null;
  if (size < 1024) return `${Math.round(size)} KB`;
  return `${(size / 1024).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DocumentRepositoryClient({
  categories,
  maxUploadMb,
}: {
  categories: RepoClientCategory[];
  maxUploadMb: number;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim();

  // A category stays visible while searching when its name matches (full
  // list shown) or at least one of its documents matches (narrowed list).
  const sections = categories
    .map((category) => {
      if (!q) return { category, documents: category.documents };
      if (matchesSearch(category.name, q)) {
        return { category, documents: category.documents };
      }
      const documents = category.documents.filter((d) => matchesSearch(d.title, q));
      return documents.length > 0 ? { category, documents } : null;
    })
    .filter((s): s is { category: RepoClientCategory; documents: RepoClientDocument[] } => s !== null);

  const matchCount = sections.reduce((sum, s) => sum + s.documents.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <BlockSearchInput
        value={query}
        onChange={setQuery}
        label="Buscar documentos"
        placeholder="Buscar documentos por título o categoría"
      />

      <p className="sr-only" aria-live="polite">
        {q
          ? `${matchCount} ${matchCount === 1 ? "documento encontrado" : "documentos encontrados"}`
          : ""}
      </p>

      {sections.length === 0 ? (
        <EmptyState icon={SearchX} message={`No se encontraron documentos para "${q}".`} />
      ) : (
        <div className="flex flex-col gap-8">
          {sections.map(({ category, documents }) => (
            <CategorySection
              key={category.documentId}
              category={category}
              documents={documents}
              searching={q.length > 0}
              maxUploadMb={maxUploadMb}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategorySection({
  category,
  documents,
  searching,
  maxUploadMb,
}: {
  category: RepoClientCategory;
  documents: RepoClientDocument[];
  searching: boolean;
  maxUploadMb: number;
}) {
  // The document count only renders for sessions that pass the READ rule:
  // upload-only roles are not entitled to know how many documents the list
  // holds. While searching it reflects the narrowed list.
  const headerBlock = (
    <div className="min-w-0">
      <h3 className="text-lg font-bold" style={{ color: "var(--color-foues-navy)" }}>
        {category.name}
        {category.canRead && documents.length > 0 && (
          <span
            className="ml-3 align-middle text-xs font-normal tabular-nums text-[var(--color-foues-text-muted)]"
            aria-label={`${documents.length} documentos`}
          >
            {documents.length} {documents.length === 1 ? "documento" : "documentos"}
          </span>
        )}
      </h3>
      {category.description && (
        <p className="mt-1 text-sm text-[var(--color-foues-text-secondary)]">
          {category.description}
        </p>
      )}
    </div>
  );

  const body = category.canRead ? (
    documents.length === 0 ? (
      <p className="mt-4 text-sm text-[var(--color-foues-text-muted)]">
        {searching
          ? "Ningún documento de esta categoría coincide con la búsqueda."
          : "Todavía no hay documentos en esta categoría."}
      </p>
    ) : (
      /* Ledger-style rows: the whole row is the download link (single
         possible action, so the row IS the action — bigger target than
         the old per-row solid button, and the accent stops repeating on
         every line; the section's one bold element stays the upload
         trigger). Format/date/size are quiet, truthful metadata: a "PDF"
         tag instead of a decorative icon, tabular figures right-aligned. */
      <ul className="mt-4 flex flex-col divide-y divide-[var(--color-foues-border-subtle)]">
        {documents.map((doc) => {
          const meta = (
            <span className="flex shrink-0 items-baseline gap-4">
              <span className="hidden text-xs tabular-nums text-[var(--color-foues-text-muted)] sm:inline">
                {doc.publishedAt &&
                  new Date(doc.publishedAt).toLocaleDateString("es-SV", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                {formatFileSize(doc.fileSize) && ` · ${formatFileSize(doc.fileSize)}`}
              </span>
            </span>
          );
          const titleBlock = (
            <span className="flex min-w-0 items-center gap-3">
              <span
                className="shrink-0 rounded-sm border border-[var(--color-foues-border-subtle)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-foues-text-muted)]"
                aria-hidden="true"
              >
                PDF
              </span>
              <span
                className="truncate text-sm font-semibold"
                style={{ color: "var(--color-foues-text-base)" }}
              >
                {doc.title}
              </span>
            </span>
          );
          return (
            <li key={doc.documentId}>
              {doc.hasFile ? (
                <a
                  href={`/api/documents/${doc.documentId}`}
                  aria-label={`Descargar ${doc.title}`}
                  className="group flex items-center justify-between gap-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-foues-accent)] motion-safe:transition-colors hover:bg-[color-mix(in_srgb,var(--color-foues-accent)_5%,transparent)]"
                >
                  {titleBlock}
                  <span className="flex shrink-0 items-center gap-4">
                    {meta}
                    <span className="flex items-center gap-1 text-xs font-semibold text-[var(--color-foues-accent)]">
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      Descargar
                    </span>
                  </span>
                </a>
              ) : (
                // No file attached (still processing or misconfigured
                // entry): render the same row, just not clickable.
                <div className="flex items-center justify-between gap-4 py-3">
                  {titleBlock}
                  {meta}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    )
  ) : (
    // Upload-only role: not entitled to read the list, but still allowed
    // to upload — explain the split rather than showing an empty list.
    <p className="mt-4 text-sm text-[var(--color-foues-text-muted)]">
      Puedes subir documentos en esta categoría; la lista solo es visible
      para los roles autorizados.
    </p>
  );

  return (
    <div className="bg-[var(--color-foues-surface-raised)] p-6 shadow-md">
      {category.canUpload ? (
        <DocumentUploadSection
          categoryId={category.documentId}
          maxUploadMb={maxUploadMb}
          header={headerBlock}
        >
          {body}
        </DocumentUploadSection>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">{headerBlock}</div>
          {body}
        </>
      )}
    </div>
  );
}
