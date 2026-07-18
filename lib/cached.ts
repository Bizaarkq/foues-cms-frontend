/**
 * React cache() wrappers shared between generateMetadata and render paths.
 *
 * Next.js memoizes GET fetches only; the Strapi client POSTs, so without
 * these wrappers generateMetadata and the page render would each trigger
 * their own Strapi round-trip for the same request.
 */

import { cache } from "react";
import { getMagazineIssueBySlug } from "./strapi";

/** Deduped per-request fetch of a magazine issue by slug. */
export const getCachedMagazineIssue = cache(getMagazineIssueBySlug);
