"use client";
/**
 * DocumentUploadModal — trigger button + native <dialog> wrapper around
 * DocumentUploadForm, rendered at the top-right of a category section
 * header (DocumentRepository.tsx) when the session can upload to it
 * (`canUploadToCategory` — same gate as before; this component adds UI
 * chrome only, it never widens who is allowed to see the button).
 *
 * Owns everything about the dialog's lifecycle so DocumentUploadForm can
 * stay focused on the ticket + XHR upload contract:
 *   - Opens via the native `showModal()` (top-layer, focus moved inside,
 *     rest of the page made inert by the browser — no manual focus trap
 *     needed).
 *   - Escape (the dialog's "cancel" event, which fires before "close") and
 *     backdrop clicks close the dialog — UNLESS an upload is in flight
 *     (status === "uploading"), in which case both are suppressed so an XHR
 *     is never silently abandoned. The explicit header close button is
 *     disabled for the same reason.
 *   - On a successful upload, DocumentUploadForm swaps its fields for a
 *     success message; this component waits ~1.8s, then closes the dialog
 *     and calls `router.refresh()` so the category's document list (an RSC
 *     render) picks up the freshly published document without a full page
 *     reload. This works because the CMS webhook expires the "documents"
 *     cache tag on document creation (see CLAUDE.md "Caching &
 *     revalidation") — `router.refresh()` re-renders the RSC tree against
 *     that now-fresh tag; `location.reload()` would be a heavier, wrong
 *     substitute for the same effect.
 *   - The form is remounted (via `formKey`) every time the dialog opens, so
 *     a previous session's title/file/status never leaks into the next one.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "lucide-react";
import DocumentUploadForm, { type UploadStatus } from "@/components/sdui/blocks/DocumentUploadForm";

/** Long enough to read the confirmation, short enough not to feel stuck. */
const AUTO_CLOSE_DELAY_MS = 1800;

export default function DocumentUploadModal({
  categoryId,
  categoryName,
  maxUploadMb,
}: {
  categoryId: string;
  categoryName: string;
  maxUploadMb: number;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [formKey, setFormKey] = useState(0);

  const isUploading = status === "uploading";
  const titleId = `upload-modal-title-${categoryId}`;

  useEffect(() => {
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, []);

  function openDialog() {
    setStatus("idle");
    setFormKey((key) => key + 1); // fresh DocumentUploadForm instance
    dialogRef.current?.showModal();
  }

  /** Only actually closes when nothing is in flight — callers don't need
   *  to check `isUploading` themselves. */
  function closeDialog() {
    if (isUploading) return;
    dialogRef.current?.close();
  }

  function handleStatusChange(next: UploadStatus) {
    setStatus(next);
    if (next === "success") {
      // The timer only closes the dialog — the refresh itself lives in
      // handleDialogClose, so a user closing early (Escape, X, backdrop)
      // during the confirmation beat still gets the fresh list.
      autoCloseTimer.current = setTimeout(() => {
        dialogRef.current?.close();
      }, AUTO_CLOSE_DELAY_MS);
    }
  }

  /** Fires on every close path (Escape, close(), the header button, or the
   *  auto-close timer above) — refresh once if an upload succeeded, then
   *  reset local state for the next open. */
  function handleDialogClose() {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    if (status === "success") router.refresh();
    setStatus("idle");
  }

  /** The "cancel" event fires on Escape, before "close" — block it while an
   *  upload is in flight instead of letting the dialog close underneath it. */
  function handleCancelEvent(event: React.SyntheticEvent<HTMLDialogElement>) {
    if (isUploading) event.preventDefault();
  }

  /** A click's target is the <dialog> element itself only when it lands on
   *  the backdrop area — content clicks are swallowed by the inner wrapper
   *  div, never bubbling up with the dialog as the target. */
  function handleBackdropClick(event: React.MouseEvent<HTMLDialogElement>) {
    if (event.target === dialogRef.current) closeDialog();
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex shrink-0 items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)]"
        style={{
          color: "var(--color-foues-accent)",
          border: "1px solid var(--color-foues-accent)",
        }}
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Subir documento
      </button>

      <dialog
        ref={dialogRef}
        onCancel={handleCancelEvent}
        onClose={handleDialogClose}
        onClick={handleBackdropClick}
        aria-labelledby={titleId}
        className="m-auto w-full max-w-md rounded-lg bg-[var(--color-foues-surface-raised)] p-0 shadow-xl backdrop:bg-[color-mix(in_srgb,var(--color-foues-navy)_60%,transparent)]"
      >
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <h3
              id={titleId}
              className="text-base font-bold"
              style={{ color: "var(--color-foues-navy)" }}
            >
              Subir documento — {categoryName}
            </h3>
            <button
              type="button"
              onClick={closeDialog}
              disabled={isUploading}
              aria-label="Cerrar"
              className="shrink-0 rounded p-1 text-[var(--color-foues-text-muted)] hover:text-[var(--color-foues-text-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] disabled:opacity-40"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <DocumentUploadForm
            key={formKey}
            categoryId={categoryId}
            maxUploadMb={maxUploadMb}
            onStatusChange={handleStatusChange}
            onCancel={closeDialog}
          />
        </div>
      </dialog>
    </>
  );
}
