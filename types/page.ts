/**
 * Page and navigation types used by the unified GraphQL query (Decision #9).
 * REQ-T04: PageQueryResult contract for getPageByPath().
 */

import type { SDUIBlock } from "./blocks";

// ---------------------------------------------------------------------------
// Route type
// ---------------------------------------------------------------------------

export type RouteType = 'page' | 'section' | 'header';

// ---------------------------------------------------------------------------
// Route nav item (used in navbar rendering)
// ---------------------------------------------------------------------------

/** Route item used in navbar rendering. */
export interface RouteNavItem {
  documentId: string;
  path: string;
  label: string | null;
  type: RouteType;
  order: number;
  slug: string | null;
  active: boolean;
  visibility: 'public' | 'requires-login';
  /** Role keys allowed to see this route. Empty = no role restriction (visibility rules). */
  allowedRoles: string[];
  children: RouteNavItem[];
}

// ---------------------------------------------------------------------------
// Page & Route (full data for route resolution)
// ---------------------------------------------------------------------------

/** Page layout enum (matches Strapi enumeration). */
export type PageLayout = "default" | "full-width";

/** Per-page SEO overrides (shared.seo component) — all fields optional in the CMS. */
export interface SeoData {
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: import("./strapi").StrapiMedia | null;
  noIndex: boolean;
}

/** Full page data from Strapi (with resolved Dynamic Zone blocks). */
export interface PageData {
  documentId: string;
  title: string;
  layout: PageLayout;
  content: SDUIBlock[];
  /** Null when the page has no shared.seo component — frontend derives fallbacks. */
  seo: SeoData | null;
}

/** Full route data including its associated page (if any). */
export interface RouteData {
  documentId: string;
  path: string;
  label: string | null;
  type: RouteType;
  slug: string | null;
  visibility: 'public' | 'requires-login';
  /** Role keys allowed to see this route. Empty = no role restriction (visibility rules). */
  allowedRoles: string[];
  page: PageData | null;
}

// ---------------------------------------------------------------------------
// Navbar & Footer
// ---------------------------------------------------------------------------

/** Item of the mobile bottom navigation bar (single type "mobile-navbar"). */
export interface MobileNavItem {
  label: string;
  icon: string | null;
  external_url: string | null;
  route: {
    path: string;
    visibility: 'public' | 'requires-login';
    /** Role keys allowed to see this route. Empty = no role restriction (visibility rules). */
    allowedRoles: string[];
    active: boolean;
    type: RouteType;
    /** Whether the route has a page attached — a tap must always land on real content. */
    hasPage: boolean;
  } | null;
}

/** Navbar data — tree of route items ordered by route.order. */
export interface NavbarData {
  items: RouteNavItem[];
  /** Configurable shortcuts of the mobile bottom bar (max 3, CMS-governed). */
  mobileNav: MobileNavItem[];
}

// ---------------------------------------------------------------------------
// Footer column types (dynamic zone)
// ---------------------------------------------------------------------------

export interface FooterColumnInstitution {
  __component: "footer.column-institution";
  logo: import("./strapi").StrapiMedia | null;
  institution_name: string | null;
  sub_name: string | null;
  description: string | null;
  social_links: import("./elements").ButtonElement[];
}

export interface FooterColumnLinks {
  __component: "footer.column-links";
  heading: string | null;
  links: import("./elements").ButtonElement[];
}

export interface FooterColumnContact {
  __component: "footer.column-contact";
  heading: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface FooterColumnText {
  __component: "footer.column-text";
  heading: string | null;
  body: string | null;
}

export type FooterColumn =
  | FooterColumnInstitution
  | FooterColumnLinks
  | FooterColumnContact
  | FooterColumnText;

/** Footer data — global singleton from Strapi. */
export interface FooterData {
  columns: FooterColumn[];
  copyright: string | null;
  bottom_links: import("./elements").ButtonElement[];
}

// ---------------------------------------------------------------------------
// Unified query result — Decision #9
// ---------------------------------------------------------------------------

/**
 * Unified query result from getPageByPath().
 * Single GraphQL round-trip returns page + navbar + footer.
 */
export interface PageQueryResult {
  route: RouteData | null;
  navbar: NavbarData;
  footer: FooterData;
}
