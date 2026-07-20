/**
 * MagazineArchive — self-fetching async RSC block.
 *
 * Placed in a page's content zone via the SDUI block registry. Fetches the
 * ready + published issues of the publications selected on the block (none
 * selected = all) and renders a responsive cover-card grid. Edition links
 * point to the dedicated /revista/{slug} route ("revista" is a reserved
 * path segment — the CMS rejects routes that collide with it).
 *
 * getAllReadyMagazineIssues() is called here instead of in the page to keep
 * the archive concern encapsulated inside the block.
 */

import { Suspense } from "react";
import { BookOpen } from "lucide-react";
import { getAllReadyMagazineIssues } from "@/lib/strapi";
import { mediaUrl } from "@/lib/media";
import { EmptyState } from "@/components/sdui/EmptyState";
import { MagazineArchiveClient } from "@/components/sdui/blocks/MagazineArchiveClient";
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

async function ArchiveGrid({ publications }: MagazineArchiveProps) {
  const publicationIds = (publications ?? []).map((p) => p.documentId);
  const issues = await getAllReadyMagazineIssues(
    publicationIds.length > 0 ? publicationIds : undefined
  );

  if (issues.length === 0) {
    return <EmptyState icon={BookOpen} message="Todavía no hay ediciones publicadas." />;
  }

  // Resolve media URLs server-side (mediaUrl reads server env) and hand the
  // grid to the client component, which owns the search box + filtering.
  const resolved = issues.map((issue) => ({
    documentId: issue.documentId,
    slug: issue.slug,
    title: issue.title,
    number: issue.number,
    date: issue.date,
    coverUrl: issue.cover ? mediaUrl(issue.cover) : null,
  }));

  return <MagazineArchiveClient issues={resolved} />;
}
