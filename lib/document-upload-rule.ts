/**
 * canReadCategory — the READ rule for a document category's document list
 * (same pattern as filterByVisibility in components/sdui/layouts/Navbar.tsx):
 * a category's documents are readable when its allowedRoles list is empty
 * (any logged-in user) or contains the session's role key.
 *
 * Single source of truth for this check — used both by DocumentRepository.tsx
 * (to decide whether to render the documents list) and by
 * canUploadToCategory() below (fallback branch).
 */
export function canReadCategory(
  category: { allowedRoles: string[] },
  roleKey: string | null
): boolean {
  if (category.allowedRoles.length === 0) return roleKey !== null;
  return roleKey !== null && category.allowedRoles.includes(roleKey);
}

/**
 * canUploadToCategory — single source of truth for the stage-2 upload
 * permission rule (design doc §"Uploads (stage 2): Server Action").
 *
 * A session may upload to a category iff:
 *   uploadEnabled AND (
 *     uploadRoles non-empty ? sessionRoleKey ∈ uploadRoles
 *                           : passes the READ rule (allowedRoles empty →
 *                             any logged-in user; else role ∈ allowedRoles)
 *   )
 *
 * Used both for UI visibility (DocumentRepository.tsx, server-side, not
 * authoritative) and for the Server Action's authoritative re-check
 * (submit-document.ts) — never duplicate this logic.
 */
export function canUploadToCategory(
  category: {
    uploadEnabled: boolean;
    uploadRoles: string[];
    allowedRoles: string[];
  },
  roleKey: string | null
): boolean {
  if (!category.uploadEnabled) return false;

  if (category.uploadRoles.length > 0) {
    return roleKey !== null && category.uploadRoles.includes(roleKey);
  }

  // Fall back to the read rule.
  return canReadCategory(category, roleKey);
}
