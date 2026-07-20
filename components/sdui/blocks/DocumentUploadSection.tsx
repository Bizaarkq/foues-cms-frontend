"use client";
/**
 * DocumentUploadSection — inline collapsible replacement for the previous
 * DocumentUploadModal (product feedback: the overlay felt heavier than the
 * task warrants). Owns a category section's header row + the collapsible
 * upload panel that expands BETWEEN the header and the document list, so
 * the trigger stays at the section's top-right and the form never sits
 * below a long list.
 *
 * The server component (DocumentRepository.tsx) renders the title block and
 * the document list and passes them in as `header` / `children` ReactNodes —
 * this wrapper only exists when the session can upload (canUploadToCategory,
 * checked server-side; read-only viewers get the plain RSC markup with no
 * client hydration at all).
 *
 * Upload lifecycle (same contract as the modal had):
 *   - The form remounts (key bump) on every expand — no stale title/file/
 *     status leaks between sessions.
 *   - Collapse is blocked while an upload is in flight so the XHR is never
 *     silently abandoned (the form's own buttons are disabled too).
 *   - On success the form swaps to its confirmation message, the panel
 *     auto-collapses after a short beat, and collapsing after a success
 *     (auto OR manual) runs `router.refresh()` exactly once so the RSC list
 *     picks up a freshly published document — the CMS webhook has already
 *     expired the "documents" cache tag by then (see CLAUDE.md "Caching &
 *     revalidation").
 *   - On expand, the panel scrolls into view (respecting
 *     prefers-reduced-motion) since, unlike a dialog, nothing forces focus
 *     toward it.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import DocumentUploadForm, { type UploadStatus } from "@/components/sdui/blocks/DocumentUploadForm";

/** Long enough to read the confirmation, short enough not to feel stuck. */
const AUTO_COLLAPSE_DELAY_MS = 1800;

export default function DocumentUploadSection({
  categoryId,
  maxUploadMb,
  header,
  children,
}: {
  categoryId: string;
  maxUploadMb: number;
  /** Title + optional description block, rendered server-side. */
  header: ReactNode;
  /** Document list / gating notes, rendered server-side. */
  children: ReactNode;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const autoCollapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [formKey, setFormKey] = useState(0);

  const isUploading = status === "uploading";

  useEffect(() => {
    return () => {
      if (autoCollapseTimer.current) clearTimeout(autoCollapseTimer.current);
    };
  }, []);

  // Unlike a dialog, an inline panel doesn't pull focus — bring it into view
  // when it opens (instant when the user prefers reduced motion).
  useEffect(() => {
    if (!expanded) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "nearest",
    });
  }, [expanded]);

  function openPanel() {
    setStatus("idle");
    setFormKey((key) => key + 1); // fresh DocumentUploadForm instance
    setExpanded(true);
  }

  /** Only actually collapses when nothing is in flight — callers don't need
   *  to check `isUploading` themselves. Collapsing after a success is the
   *  single place the refresh runs, so auto-collapse and a manual close
   *  during the confirmation beat behave identically. */
  function closePanel() {
    if (isUploading) return;
    if (autoCollapseTimer.current) {
      clearTimeout(autoCollapseTimer.current);
      autoCollapseTimer.current = null;
    }
    if (status === "success") router.refresh();
    setStatus("idle");
    setExpanded(false);
  }

  function handleStatusChange(next: UploadStatus) {
    setStatus(next);
    if (next === "success") {
      autoCollapseTimer.current = setTimeout(() => {
        // Re-read nothing: closePanel's success check uses state, but this
        // timer only ever fires while status is still "success" — any close
        // before it cleared the timer.
        setExpanded(false);
        setStatus("idle");
        autoCollapseTimer.current = null;
        router.refresh();
      }, AUTO_COLLAPSE_DELAY_MS);
    }
  }

  return (
    <>
      {/* Mobile: title + description stack first, trigger flows below them;
          from sm up the trigger returns to the section's top-right corner. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        {header}
        <button
          type="button"
          onClick={expanded ? closePanel : openPanel}
          disabled={expanded && isUploading}
          aria-expanded={expanded}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] disabled:opacity-40"
          style={{
            color: "var(--color-foues-accent)",
            border: "1px solid var(--color-foues-accent)",
          }}
        >
          {expanded ? (
            <X className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Upload className="h-4 w-4" aria-hidden="true" />
          )}
          {expanded ? "Cerrar" : "Subir documento"}
        </button>
      </div>

      {expanded && (
        <div
          ref={panelRef}
          className="mt-4 border border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-sunken)] p-4"
        >
          <DocumentUploadForm
            key={formKey}
            categoryId={categoryId}
            maxUploadMb={maxUploadMb}
            onStatusChange={handleStatusChange}
            onCancel={closePanel}
          />
        </div>
      )}

      {children}
    </>
  );
}
