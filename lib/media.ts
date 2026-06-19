import { env } from "./env";
import type { StrapiMedia } from "@/types/strapi";

export function mediaUrl(media: StrapiMedia | null): string | null {
  if (!media) return null;
  const u = media.url;
  if (/^https?:\/\//i.test(u)) return u;
  return `${env.strapi.publicUrl}${u.startsWith("/") ? "" : "/"}${u}`;
}

export function mediaAlt(media: StrapiMedia | null, fallback: string = ""): string {
  if (!media) return fallback;
  return media.alternativeText ?? media.name ?? fallback ?? "";
}
