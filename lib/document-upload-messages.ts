/**
 * Shared result shape + CMS-error-code → Spanish message mapping for the
 * document-repository upload flow.
 *
 * Moved out of the old Server Action (app/actions/submit-document.ts,
 * deleted) when stage-2 uploads first migrated to a streaming route handler,
 * and now consumed from two call sites under the ticket-based redesign:
 *   - app/api/documents/upload-ticket/route.ts (server-side) — maps error
 *     codes from the CMS's ticket-issuance endpoint (`invalid_category`,
 *     `category_not_found`, `upload_not_enabled`, `invalid_title`,
 *     `invalid_email`).
 *   - components/sdui/blocks/DocumentUploadForm.tsx (client-side) — maps
 *     error codes from the CMS's public, ticket-gated file-upload endpoint
 *     that the browser calls directly (`invalid_ticket`, `invalid_file_count`,
 *     `invalid_extension`, `invalid_mime_type`, `invalid_file_signature`,
 *     `file_too_large`, plus the same `upload_not_enabled`/`internal_error`).
 * Kept as its own plain-function module (no server-only dependencies) so it
 * is safe to import from both a route handler and a "use client" component.
 */

export interface DocumentUploadResult {
  ok: boolean;
  error?: string;
  published?: boolean;
}

/**
 * Maps a CMS-reported error code to a Spanish, user-facing message.
 * `maxUploadMb` is threaded in (rather than hardcoded) so the message
 * matches whichever value is authoritative for the failure being reported —
 * the route's own site-settings read for its own pre-CMS checks, or the
 * CMS's fresh `limit_mb` for CMS-side rejections.
 */
export function mapUploadError(code: string | undefined, maxUploadMb: number): string {
  switch (code) {
    case "invalid_title":
      return "El título es requerido (máximo 200 caracteres).";
    case "invalid_category":
    case "category_not_found":
      return "Categoría inválida.";
    case "upload_not_enabled":
      return "Esta categoría no admite subida de documentos.";
    case "invalid_file_count":
    case "invalid_extension":
    case "invalid_mime_type":
    case "invalid_file_signature":
      return "El archivo debe ser un PDF válido.";
    case "file_too_large":
      return `El archivo supera el tamaño máximo permitido (${maxUploadMb} MB).`;
    case "invalid_email":
      return "No se pudo verificar tu correo institucional. Vuelve a iniciar sesión.";
    case "invalid_ticket":
      return "La sesión de subida expiró. Inténtalo de nuevo.";
    default:
      return "No se pudo subir el documento. Inténtalo de nuevo.";
  }
}
