/**
 * MobileBottomNav — RSC wrapper for the mobile bottom navigation (issue #3).
 * Resolves the session, applies the same visibility filtering as the desktop
 * Navbar, and validates the CMS-governed bar shortcuts before handing a
 * plain, serializable payload to the isolated client component.
 *
 * Bar shortcut rules (single type "mobile-navbar" in Strapi, max 3):
 * - external_url wins over route when both are set
 * - internal targets must be an active route WITH a page attached — a tap
 *   must always land on real content (route type alone is not enough:
 *   'section' routes can carry a page too, e.g. /pregrado)
 * - 'requires-login' targets are hidden from anonymous visitors
 */

import type { NavbarData } from "@/types/page";
import { auth } from "@/lib/auth";
import { filterByVisibility } from "./Navbar";
import { MobileBottomNavClient, type MobileBarShortcut } from "./MobileBottomNavClient";

export async function MobileBottomNav({ navbar }: { navbar: NavbarData }) {
  const session = await auth();
  const isLoggedIn = session != null;

  // Same shape the desktop Navbar renders: root containers flattened to
  // their children, ordered by route.order.
  const menuItems = filterByVisibility(navbar.items, isLoggedIn)
    .flatMap((root) => root.children)
    .sort((a, b) => a.order - b.order);

  const shortcuts: MobileBarShortcut[] = navbar.mobileNav
    .filter((item) => {
      if (item.external_url) return true;
      if (!item.route) return false;
      if (!item.route.active || !item.route.hasPage || !item.route.path) return false;
      if (item.route.visibility === "requires-login" && !isLoggedIn) return false;
      return true;
    })
    .slice(0, 3)
    .map((item) => ({
      label: item.label,
      icon: item.icon,
      href: item.external_url ?? item.route!.path,
      external: item.external_url != null,
    }));

  return <MobileBottomNavClient items={menuItems} shortcuts={shortcuts} />;
}
