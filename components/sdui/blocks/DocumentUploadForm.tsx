"use client";
/**
 * DocumentUploadForm — stage 2 upload UI for the document repository block.
 *
 * Collapsed into a "Subir documento" button per category; expands into a
 * small form (title + PDF file) wired to the submitDocument Server Action
 * via useActionState. The category gate that decided whether to render
 * this component at all (DocumentRepository.tsx) is UI-only — the Server
 * Action re-validates authoritatively (submit-form trust model).
 */
import { useActionState, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { submitDocument, type SubmitDocumentResult } from "@/app/actions/submit-document";

const initialState: SubmitDocumentResult | null = null;

export default function DocumentUploadForm({ categoryId }: { categoryId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState(submitDocument, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)]"
        style={{
          color: "var(--color-foues-accent)",
          border: "1px solid var(--color-foues-accent)",
        }}
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Subir documento
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="mt-4 flex flex-col gap-3 border-t border-[var(--color-foues-border-subtle)] pt-4"
    >
      <input type="hidden" name="categoryId" value={categoryId} />

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`title-${categoryId}`}
          className="text-xs font-semibold text-[var(--color-foues-text-secondary)]"
        >
          Título del documento
        </label>
        <input
          id={`title-${categoryId}`}
          name="title"
          type="text"
          required
          maxLength={200}
          disabled={isPending}
          className="rounded border border-[var(--color-foues-border-subtle)] bg-[var(--color-foues-surface-raised)] px-3 py-1.5 text-sm text-[var(--color-foues-text-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)]"
          placeholder="Ej. Reglamento interno 2026"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`file-${categoryId}`}
          className="text-xs font-semibold text-[var(--color-foues-text-secondary)]"
        >
          Archivo PDF
        </label>
        <input
          id={`file-${categoryId}`}
          name="file"
          type="file"
          accept="application/pdf"
          required
          disabled={isPending}
          className="text-sm text-[var(--color-foues-text-base)] file:mr-3 file:rounded file:border-0 file:bg-[var(--color-foues-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] disabled:opacity-60"
          style={{ backgroundColor: "var(--color-foues-accent)" }}
        >
          {isPending ? "Subiendo…" : "Enviar"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          disabled={isPending}
          className="text-sm text-[var(--color-foues-text-muted)] underline-offset-2 hover:underline"
        >
          Cancelar
        </button>
      </div>

      {state && !isPending && (
        <p
          className="text-sm"
          role="status"
          style={{
            color: state.ok
              ? "var(--color-foues-state-success)"
              : "var(--color-foues-state-error)",
          }}
        >
          {state.ok
            ? state.published
              ? "Documento publicado."
              : "Documento enviado; quedará visible cuando sea aprobado."
            : state.error}
        </p>
      )}
    </form>
  );
}
