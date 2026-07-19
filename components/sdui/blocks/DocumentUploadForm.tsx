"use client";
/**
 * DocumentUploadForm — stage 2 upload UI for the document repository block.
 *
 * Collapsed into a "Subir documento" button per category; expands into a
 * small form (title + PDF file) that now uploads in TWO network steps under
 * the ticket-based upload redesign:
 *   A. Client-side pre-checks (no network) — title, file selection,
 *      extension, and size are all validated locally first.
 *   B. `POST /api/documents/upload-ticket` (this app) — session + role
 *      re-validated server-side, returns a short-lived, single-use
 *      `uploadUrl` pointing straight at the CMS.
 *   C. `XMLHttpRequest` straight to that `uploadUrl` (the CMS's own public,
 *      ticket-gated endpoint) — this app never sees the file bytes at all.
 * XHR (rather than fetch) is used deliberately for step C: it's the only
 * browser API that exposes upload progress (`xhr.upload.onprogress`) —
 * fetch's request body can be streamed, but the browser gives no equivalent
 * progress signal for the OUTGOING (upload) direction of a fetch() call.
 *
 * The category gate that decided whether to render this component at all
 * (DocumentRepository.tsx) is UI-only — `upload-ticket/route.ts` re-validates
 * authoritatively (submit-form trust model, same posture as before).
 *
 * No magic-byte check happens on the client (or in this app at all)
 * anymore: the file bytes are never parsed here. The extension/size checks
 * below are a UX nicety only, not a security boundary — the CMS remains the
 * sole enforcement point for file type/MIME/signature/size
 * (its own `/api/documents/upload/{ticket}` controller).
 */
import { useRef, useState, type FormEvent } from "react";
import { Upload } from "lucide-react";
import { mapUploadError } from "@/lib/document-upload-messages";

interface TicketIssueResult {
  ok: boolean;
  error?: string;
  uploadUrl?: string;
  expiresAt?: string;
}

interface CmsUploadResult {
  ok: boolean;
  error?: string;
  published?: boolean;
  documentId?: string;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface UploadState {
  status: UploadStatus;
  percent: number;
  message: string | null;
  published: boolean | null;
}

const initialState: UploadState = {
  status: "idle",
  percent: 0,
  message: null,
  published: null,
};

export default function DocumentUploadForm({
  categoryId,
  maxUploadMb,
}: {
  categoryId: string;
  maxUploadMb: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<UploadState>(initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isUploading = state.status === "uploading";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isUploading) return; // guard against double-submit

    const title = titleRef.current?.value.trim() ?? "";
    const file = fileRef.current?.files?.[0];

    // --- Step A: client-side pre-checks (no network, immediate feedback). ---
    if (!title) {
      setState({ status: "error", percent: 0, message: "El título es requerido.", published: null });
      return;
    }
    if (!file) {
      setState({
        status: "error",
        percent: 0,
        message: "Debes seleccionar un archivo.",
        published: null,
      });
      return;
    }
    // Cheap client-side check for UX only — see the file header comment.
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setState({
        status: "error",
        percent: 0,
        message: "Solo se aceptan archivos PDF.",
        published: null,
      });
      return;
    }
    if (file.size > maxUploadMb * 1024 * 1024) {
      setState({
        status: "error",
        percent: 0,
        message: `El archivo supera el tamaño máximo permitido (${maxUploadMb} MB).`,
        published: null,
      });
      return;
    }

    // Show upload state immediately — even though step B (ticket issuance)
    // has no progress signal of its own, the user should see *something*
    // happening as soon as they submit.
    setState({ status: "uploading", percent: 0, message: null, published: null });

    // --- Step B: fetch a one-time upload ticket from this app. ---
    let ticket: TicketIssueResult | null = null;
    try {
      const ticketRes = await fetch("/api/documents/upload-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, title }),
      });
      ticket = (await ticketRes.json()) as TicketIssueResult;
      if (!ticketRes.ok || !ticket?.ok || !ticket.uploadUrl) {
        setState({
          status: "error",
          percent: 0,
          message: ticket?.error ?? "No se pudo preparar la subida. Inténtalo de nuevo.",
          published: null,
        });
        return;
      }
    } catch {
      setState({
        status: "error",
        percent: 0,
        message: "Error de red al preparar la subida. Inténtalo de nuevo.",
        published: null,
      });
      return;
    }

    const uploadUrl = ticket.uploadUrl;

    // Only the file field goes in the body — category/title/uploader
    // identity are all bound to the ticket server-side now.
    const formData = new FormData();
    formData.append("file", file, file.name);

    const xhr = new XMLHttpRequest();
    // Full absolute CMS URL returned by step B — not a path on this app.
    xhr.open("POST", uploadUrl);
    // No cookies needed: the CMS endpoint is public, gated by the ticket
    // itself (the credential lives in the URL), not by session — do not add
    // withCredentials just because the endpoint "feels" protected.
    // Matches the CMS's upload-ticket TTL (`TICKET_TTL_MS` in
    // `document-upload-ticket/controllers/issue.ts`, 60 minutes) — the
    // governing constraint is how long the ticket itself stays valid, not
    // anything client-side; no reason to keep waiting past that.
    xhr.timeout = 60 * 60_000;

    xhr.upload.onprogress = (progressEvent) => {
      if (!progressEvent.lengthComputable) return;
      const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
      setState((prev) => ({ ...prev, status: "uploading", percent }));
    };

    xhr.onload = () => {
      let json: CmsUploadResult | null = null;
      try {
        json = JSON.parse(xhr.responseText) as CmsUploadResult;
      } catch {
        json = null;
      }

      if (xhr.status >= 200 && xhr.status < 300 && json?.ok) {
        setState({
          status: "success",
          percent: 100,
          message: null,
          published: json.published ?? false,
        });
        formRef.current?.reset();
      } else {
        // The CMS's `message` is English/internal — never shown to the
        // user. Only the mapped Spanish string reaches the UI.
        setState({
          status: "error",
          percent: 0,
          message: mapUploadError(json?.error, maxUploadMb),
          published: null,
        });
      }
    };

    xhr.onerror = () => {
      setState({
        status: "error",
        percent: 0,
        message:
          "Error de red al subir el documento. Antes de reintentar, verifica si el documento ya aparece en la lista.",
        published: null,
      });
    };

    xhr.ontimeout = () => {
      setState({
        status: "error",
        percent: 0,
        message: "La subida tardó demasiado tiempo. Inténtalo de nuevo.",
        published: null,
      });
    };

    xhr.send(formData);
  }

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
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col gap-3 border-t border-[var(--color-foues-border-subtle)] pt-4"
    >
      <div className="flex flex-col gap-1">
        <label
          htmlFor={`title-${categoryId}`}
          className="text-xs font-semibold text-[var(--color-foues-text-secondary)]"
        >
          Título del documento
        </label>
        <input
          id={`title-${categoryId}`}
          ref={titleRef}
          name="title"
          type="text"
          required
          maxLength={200}
          disabled={isUploading}
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
          ref={fileRef}
          name="file"
          type="file"
          accept="application/pdf"
          required
          disabled={isUploading}
          className="text-sm text-[var(--color-foues-text-base)] file:mr-3 file:rounded file:border-0 file:bg-[var(--color-foues-accent)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
        />
        <span className="text-xs text-[var(--color-foues-text-muted)]">
          PDF, máximo {maxUploadMb} MB.
        </span>
      </div>

      {isUploading && (
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-foues-border-subtle)]"
          role="progressbar"
          aria-valuenow={state.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full transition-[width] duration-150"
            style={{ width: `${state.percent}%`, backgroundColor: "var(--color-foues-accent)" }}
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isUploading}
          className="inline-flex items-center rounded px-4 py-2 text-sm font-semibold text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] disabled:opacity-60"
          style={{ backgroundColor: "var(--color-foues-accent)" }}
        >
          {isUploading ? `Subiendo… ${state.percent}%` : "Enviar"}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          disabled={isUploading}
          className="text-sm text-[var(--color-foues-text-muted)] underline-offset-2 hover:underline"
        >
          Cancelar
        </button>
      </div>

      {(state.status === "success" || state.status === "error") && (
        <p
          className="text-sm"
          role="status"
          style={{
            color:
              state.status === "success"
                ? "var(--color-foues-state-success)"
                : "var(--color-foues-state-error)",
          }}
        >
          {state.status === "success"
            ? state.published
              ? "Documento publicado."
              : "Documento enviado; quedará visible cuando sea aprobado."
            : state.message}
        </p>
      )}
    </form>
  );
}
