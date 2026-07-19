/**
 * DocumentRepository — self-fetching async RSC block (stage 1, read-only).
 *
 * Placed in a page's content zone via the SDUI block registry. Repository
 * content is never shown to anonymous visitors — the session gate runs
 * before any Strapi fetch. For logged-in users, categories + documents are
 * fetched WITHOUT role filtering (cached fetch, tags: ["documents"]) and
 * then filtered per request against the session role. A category is
 * visible when the session can either READ it (allowedRoles empty → any
 * logged-in user; else role ∈ allowedRoles — mirrors the navbar's
 * filterByVisibility pattern) OR UPLOAD to it (canUploadToCategory) —
 * an upload-only role must still see the category to reach its upload
 * form, even though the documents list itself stays read-rule-gated.
 *
 * Downloads never expose the raw Strapi upload URL — links point at the
 * token-holding proxy `/api/documents/{documentId}`, which re-validates the
 * role gate server-to-server before streaming the file.
 *
 * Stage 2: each category section header shows a "Subir documento" button
 * at its top-right when canUploadToCategory() passes for the current
 * session — this is a UI-visibility check only, `upload-ticket/route.ts`
 * re-validates authoritatively. The button opens DocumentUploadModal
 * (client component: trigger + native <dialog> + DocumentUploadForm), so a
 * long document list no longer has to be scrolled past to reach the form.
 */

import { Suspense } from "react";
import Link from "next/link";
import { Download, FileText, Lock } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDocumentRepositoryData, getSiteSettings } from "@/lib/strapi";
import { canReadCategory, canUploadToCategory } from "@/lib/document-upload-rule";
import { EmptyState } from "@/components/sdui/EmptyState";
import DocumentUploadModal from "@/components/sdui/blocks/DocumentUploadModal";
import type { DocumentRepositoryProps } from "@/types/blocks";
import type { DocumentCategory, RepoDocument } from "@/types/collections";

/**
 * Formats a size as a short human-readable string, or null when unknown.
 * Strapi's `file.size` attribute is in KILOBYTES (float), not bytes.
 */
function formatFileSize(size: number | null): string | null {
  if (size === null || !Number.isFinite(size) || size <= 0) return null;
  if (size < 1024) return `${Math.round(size)} KB`;
  return `${(size / 1024).toFixed(1)} MB`;
}

/** Skeleton mientras el RSC async resuelve el fetch de categorías/documentos. */
function RepositorySkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="bg-[var(--color-foues-surface-raised)] p-6 shadow-md">
          <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
          <div className="flex flex-col gap-2">
            <div className="h-4 w-full animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Friendly Spanish prompt for anonymous visitors — repository is never shown to them. */
function LoginPrompt({ title }: { title?: string | null }) {
  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface-sunken)]">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="mb-10">
          <h2
            className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
            style={{ color: "var(--color-foues-navy)" }}
          >
            {title || "Documentos"}
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
            aria-hidden="true"
          />
        </div>
        <div className="flex flex-col items-center gap-3 bg-[var(--color-foues-surface-raised)] py-12 text-center shadow-md">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-foues-accent) 12%, transparent)",
            }}
            aria-hidden="true"
          >
            <Lock className="h-6 w-6 text-[var(--color-foues-accent)]" />
          </span>
          <p className="text-sm text-[var(--color-foues-text-muted)]">
            Inicia sesión para ver los documentos disponibles.
          </p>
          <Link
            href="/login"
            className="mt-2 inline-block rounded px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)]"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </section>
  );
}

export default async function DocumentRepository(props: DocumentRepositoryProps) {
  const session = await auth();
  if (!session) {
    return <LoginPrompt title={props.title} />;
  }

  const roleKey = session.user?.role?.key ?? null;
  // Fetched once here (not inside DocumentUploadForm) so the limit arrives
  // only as a server-resolved prop — see lib/strapi.ts getSiteSettings().
  const { maxUploadMb } = await getSiteSettings();

  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface-sunken)]">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="mb-10">
          <h2
            className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
            style={{ color: "var(--color-foues-navy)" }}
          >
            {props.title || "Documentos"}
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
            aria-hidden="true"
          />
        </div>
        <Suspense fallback={<RepositorySkeleton />}>
          <RepositoryContent {...props} roleKey={roleKey} maxUploadMb={maxUploadMb} />
        </Suspense>
      </div>
    </section>
  );
}

async function RepositoryContent({
  categories: selectedCategories,
  roleKey,
  maxUploadMb,
}: DocumentRepositoryProps & { roleKey: string | null; maxUploadMb: number }) {
  const categoryIds = (selectedCategories ?? []).map((c) => c.documentId);
  const { categories, documents } = await getDocumentRepositoryData(
    categoryIds.length > 0 ? categoryIds : undefined
  );

  // Visibility gate: a category shows up if the session can either read its
  // documents OR upload to it — an upload-only role (in uploadRoles but not
  // allowedRoles) must still see the category to reach its upload form, even
  // though the documents list itself stays gated to the read rule.
  const visibleCategories = categories.filter(
    (c) => canReadCategory(c, roleKey) || canUploadToCategory(c, roleKey)
  );

  if (visibleCategories.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        message="No hay documentos disponibles para tu perfil por el momento."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {visibleCategories.map((category) => (
        <CategorySection
          key={category.documentId}
          category={category}
          documents={documents.filter((d) => d.categoryId === category.documentId)}
          canRead={canReadCategory(category, roleKey)}
          canUpload={canUploadToCategory(category, roleKey)}
          maxUploadMb={maxUploadMb}
        />
      ))}
    </div>
  );
}

function CategorySection({
  category,
  documents,
  canRead,
  canUpload,
  maxUploadMb,
}: {
  category: DocumentCategory;
  documents: RepoDocument[];
  canRead: boolean;
  canUpload: boolean;
  maxUploadMb: number;
}) {
  return (
    <div className="bg-[var(--color-foues-surface-raised)] p-6 shadow-md">
      {/* Header row: category title/description on the left, the upload
          trigger pinned to the top-right — keeps it reachable without
          scrolling past a long document list. The document count only
          renders for sessions that pass the READ rule: upload-only roles
          are not entitled to know how many documents the list holds. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold" style={{ color: "var(--color-foues-navy)" }}>
            {category.name}
            {canRead && documents.length > 0 && (
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
        {canUpload && (
          <DocumentUploadModal
            categoryId={category.documentId}
            categoryName={category.name}
            maxUploadMb={maxUploadMb}
          />
        )}
      </div>

      {canRead ? (
        documents.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-foues-text-muted)]">
            Todavía no hay documentos en esta categoría.
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
                    {doc.file &&
                      formatFileSize(doc.file.size) &&
                      ` · ${formatFileSize(doc.file.size)}`}
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
                  {doc.file ? (
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
      )}
    </div>
  );
}
