"use client";

/**
 * BackLink — returns the reader to wherever they came from.
 *
 * Edition URLs are reachable from any page holding an archive block, so a
 * fixed back target would strand readers. Uses history.back() only when the
 * reader navigated here from within the site (same-origin referrer); direct
 * visits and external referrers go to the fallback instead.
 */

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  /** Target when there is no same-origin history to go back to. */
  fallbackHref: string;
  label: string;
}

export function BackLink({ fallbackHref, label }: BackLinkProps) {
  const router = useRouter();

  const handleClick = () => {
    const cameFromSite =
      window.history.length > 1 &&
      document.referrer.startsWith(window.location.origin);
    if (cameFromSite) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-sm font-medium mb-6 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-foues-accent)] rounded"
      style={{ color: "var(--color-foues-text-secondary)" }}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
