/**
 * MagazineArchive — self-fetching async RSC block.
 *
 * Placed in a page's content zone via the SDUI block registry. Fetches the
 * ready + published issues of the publications selected on the block (none
 * selected = all) and renders a responsive cover-card grid. Edition links
 * are relative to the page holding the block — childPath(pagePath, slug) —
 * the catch-all resolves them back to MagazineViewer (no hardcoded prefix).
 *
 * getAllReadyMagazineIssues() is called here instead of in the page to keep
 * the archive concern encapsulated inside the block.
 */

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { getAllReadyMagazineIssues } from "@/lib/strapi";
import { childPath } from "@/lib/paths";
import { mediaUrl } from "@/lib/media";
import { EmptyState } from "@/components/sdui/EmptyState";
import type { MagazineArchiveProps } from "@/types/blocks";

/** Skeleton del grid de portadas mientras el RSC async resuelve su fetch. */
function ArchiveSkeleton() {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="overflow-hidden bg-[var(--color-foues-surface-raised)] shadow-md">
          <div className="aspect-[3/4] w-full animate-pulse bg-[var(--color-foues-border-subtle)]" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-foues-border-subtle)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MagazineArchive(props: MagazineArchiveProps) {
  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface-sunken)]">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="mb-10">
          <h2
            className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
            style={{ color: "var(--color-foues-navy)" }}
          >
            {props.title || "Publicaciones"}
          </h2>
          <span
            className="mt-2 block h-1 w-16 rounded-full"
            style={{ backgroundColor: "var(--color-foues-accent)" }}
            aria-hidden="true"
          />
        </div>
        <Suspense fallback={<ArchiveSkeleton />}>
          <ArchiveGrid {...props} />
        </Suspense>
      </div>
    </section>
  );
}

async function ArchiveGrid({
  publications,
  pagePath,
}: MagazineArchiveProps) {
  const publicationIds = (publications ?? []).map((p) => p.documentId);
  const issues = await getAllReadyMagazineIssues(
    publicationIds.length > 0 ? publicationIds : undefined
  );
  const basePath = pagePath ?? "/";

  return (
    <>
      {issues.length === 0 ? (
        <EmptyState icon={BookOpen} message="Todavía no hay ediciones publicadas." />
      ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {issues.map((issue) => {
              const coverUrl = issue.cover ? mediaUrl(issue.cover) : null;

              return (
                <Link
                  key={issue.documentId}
                  href={childPath(basePath, issue.slug)}
                  className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] rounded"
                >
                  <div className="bg-[var(--color-foues-surface-raised)] shadow-md overflow-hidden flex flex-col h-full transition-shadow group-hover:shadow-lg">
                    {coverUrl ? (
                      <div className="relative aspect-[3/4] w-full overflow-hidden shrink-0">
                        <Image
                          src={coverUrl}
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
              );
            })}
          </div>
      )}
    </>
  );
}
