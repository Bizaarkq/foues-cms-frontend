"use server";
/**
 * submit-document — stage 2 upload Server Action (design doc
 * §"Uploads (stage 2): Server Action"). Follows the submit-form trust
 * model (app/actions/submit-form.ts): the client defines nothing — the
 * category's upload config is re-fetched server-side and re-validated
 * against the session role before anything is forwarded to the CMS.
 *
 * The CMS endpoint contract (POST /api/documents/upload) is implemented in
 * parallel in the sibling foues-cms-api repo; this action only forwards a
 * validated multipart payload and never trusts its response shape beyond
 * the documented `{ ok, published, documentId } | { ok: false, error }`.
 */
import { revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { getDocumentCategoryForUpload, getSiteSettings } from "@/lib/strapi";
import { canUploadToCategory } from "@/lib/document-upload-rule";

export interface SubmitDocumentResult {
  ok: boolean;
  error?: string;
  published?: boolean;
}

const PDF_MAGIC_BYTES = "%PDF-";

/**
 * Maps a CMS-reported error code to a Spanish, user-facing message.
 * `maxUploadMb` is threaded in (rather than re-fetched here) so the message
 * matches the same site-settings value already used for the pre-CMS size
 * check in submitDocument().
 */
function mapUploadError(code: string | undefined, maxUploadMb: number): string {
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
    default:
      return "No se pudo subir el documento. Inténtalo de nuevo.";
  }
}

export async function submitDocument(
  _prevState: SubmitDocumentResult | null,
  formData: FormData
): Promise<SubmitDocumentResult> {
  try {
    const session = await auth();
    if (!session) {
      return { ok: false, error: "Debes iniciar sesión para subir documentos." };
    }

    // Admin-editable ceiling — see lib/strapi.ts getSiteSettings() (clamped
    // to [1, 15], matching next.config.ts's build-time bodySizeLimit).
    const { maxUploadMb } = await getSiteSettings();
    const maxFileSize = maxUploadMb * 1024 * 1024;

    const categoryId = formData.get("categoryId");
    if (typeof categoryId !== "string" || categoryId.trim() === "") {
      return { ok: false, error: "Categoría inválida." };
    }

    // Authoritative re-check — never trust that the button the client saw
    // was actually gated correctly (submit-form trust model).
    const category = await getDocumentCategoryForUpload(categoryId);
    if (!category) {
      return { ok: false, error: "Categoría inválida." };
    }

    const roleKey = session.user?.role?.key ?? null;
    if (!canUploadToCategory(category, roleKey)) {
      // Generic message — never reveal category upload config to a session
      // that isn't allowed to upload (design doc: existence/config is not
      // to be disclosed, same posture as the download proxy's 404s).
      return { ok: false, error: "No tienes permiso para subir documentos en esta categoría." };
    }

    const rawTitle = formData.get("title");
    if (typeof rawTitle !== "string") {
      return { ok: false, error: "Título inválido." };
    }
    const title = rawTitle.trim();
    if (title.length < 1 || title.length > 200) {
      return { ok: false, error: "El título debe tener entre 1 y 200 caracteres." };
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, error: "Debes seleccionar un archivo." };
    }
    if (file.size <= 0 || file.size > maxFileSize) {
      return { ok: false, error: `El archivo debe pesar como máximo ${maxUploadMb} MB.` };
    }
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      return { ok: false, error: "Solo se aceptan archivos PDF." };
    }

    const headerBytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    const magic = new TextDecoder("ascii").decode(headerBytes);
    if (magic !== PDF_MAGIC_BYTES) {
      return { ok: false, error: "El archivo no es un PDF válido." };
    }

    const uploadForm = new FormData();
    uploadForm.append("file", file, file.name);
    uploadForm.append("category", categoryId);
    uploadForm.append("title", title);
    uploadForm.append("uploaded_by_name", session.user?.name ?? "");
    uploadForm.append("uploaded_by_email", session.user?.email ?? "");

    let res: Response;
    try {
      res = await fetch(`${env.strapi.url}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.documentToken}` },
        body: uploadForm,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      console.error("[submit-document] upload request failed:", err);
      // The request may have actually reached the CMS before the client-side
      // timeout/network failure fired (no idempotency key in v1) — warn the
      // user to check before retrying instead of silently resubmitting.
      return {
        ok: false,
        error:
          "Error de red al subir el documento. Antes de reintentar, verifica si el documento ya aparece en la lista.",
      };
    }

    let json: {
      ok?: boolean;
      published?: boolean;
      error?: string;
      limit_mb?: number;
    } | null = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }

    if (!res.ok || !json?.ok) {
      console.error(
        `[submit-document] CMS upload failed: HTTP ${res.status} — ${JSON.stringify(json)}`
      );
      // Prefer the CMS-reported limit (authoritative, read fresh per request)
      // over our tag-cached copy, which may be stale right after an admin
      // lowers the value.
      return {
        ok: false,
        error: mapUploadError(json?.error, json?.limit_mb ?? maxUploadMb),
      };
    }

    // Expire the cached repository fetch so a published upload shows up
    // immediately (design doc step 4).
    revalidateTag("documents", { expire: 0 });

    return { ok: true, published: json.published ?? false };
  } catch (err) {
    console.error("[submit-document] unexpected error:", err);
    return { ok: false, error: "Error inesperado al subir el documento." };
  }
}
