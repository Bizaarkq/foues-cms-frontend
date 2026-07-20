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
 * re-validates authoritatively. The button expands DocumentUploadSection's
 * inline panel between the header and the document list (client wrapper:
 * trigger + collapsible panel + DocumentUploadForm), so a long document
 * list no longer has to be scrolled past to reach the form. Read-only
 * viewers get plain RSC markup — the client wrapper only mounts when the
 * session can upload.
 */

import { Suspense } from "react";
import Link from "next/link";
import { FileText, Lock } from "lucide-react";
import { auth } from "@/lib/auth";
import { getDocumentRepositoryData, getSiteSettings } from "@/lib/strapi";
import { canReadCategory, canUploadToCategory } from "@/lib/document-upload-rule";
import { EmptyState } from "@/components/sdui/EmptyState";
import {
  DocumentRepositoryClient,
  type RepoClientCategory,
} from "@/components/sdui/blocks/DocumentRepositoryClient";
import type { DocumentRepositoryProps } from "@/types/blocks";

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

  // Serialisable payload for the client component (search + rendering).
  // Gate invariant: an upload-only category (canRead false) gets an EMPTY
  // documents array — its list data must never reach the browser.
  const clientCategories: RepoClientCategory[] = visibleCategories.map((category) => {
    const canRead = canReadCategory(category, roleKey);
    return {
      documentId: category.documentId,
      name: category.name,
      description: category.description,
      canRead,
      canUpload: canUploadToCategory(category, roleKey),
      documents: canRead
        ? documents
            .filter((d) => d.categoryId === category.documentId)
            .map((d) => ({
              documentId: d.documentId,
              title: d.title,
              publishedAt: d.publishedAt,
              fileSize: d.file?.size ?? null,
              hasFile: d.file !== null,
            }))
        : [],
    };
  });

  return <DocumentRepositoryClient categories={clientCategories} maxUploadMb={maxUploadMb} />;
}
