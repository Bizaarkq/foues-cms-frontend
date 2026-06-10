/**
 * Element component types — fine-grained repeatable sub-components.
 * REQ-T02: Element shapes matching Strapi component schemas.
 */

import type { StrapiMedia } from "./strapi";

/** Skeleton v4 button variant values (matches elements.button enum). */
export type ButtonVariant =
  | "variant-filled-primary"
  | "variant-filled-secondary"
  | "variant-ghost-primary"
  | "variant-ghost-secondary"
  | "variant-soft-primary"
  | "variant-ringed-primary";

/** elements.button */
export interface ButtonElement {
  label: string;
  url: string | null;
  variant: ButtonVariant;
  icon: string | null;
}

/** elements.card */
export interface CardElement {
  title: string;
  description: string | null;
  image: StrapiMedia | null;
  url: string | null;
  tag: string | null;
  customClasses: string | null;
}

/** elements.timeline-item */
export interface TimelineItemElement {
  year: string;
  title: string;
  description: string | null;
}

/** elements.step */
export interface StepElement {
  number: number;
  title: string;
  description: string | null;
  icon: string | null;
}

/** Schedule category enum (matches elements.schedule-item). */
export type ScheduleCategory =
  | "academic"
  | "event"
  | "deadline"
  | "holiday"
  | "other";

/** elements.schedule-item */
export interface ScheduleItemElement {
  date: string; // ISO date string "YYYY-MM-DD"
  title: string;
  description: string | null;
  category: ScheduleCategory;
}

/** elements.quick-link-item */
export interface QuickLinkItem {
  label: string;
  url: string | null;
  icon: string | null;
  description: string | null;
}

/** elements.list-item */
export interface ListItem {
  text: string;
}

/** elements.date-entry */
export interface DateEntry {
  start_date: string;      // ISO "YYYY-MM-DD"
  end_date: string | null; // ISO "YYYY-MM-DD" or null
  label: string;
  description: string | null;
}

/** elements.schedule-entry */
export interface ScheduleEntryElement {
  day_range: string;
  time_range: string;
}
