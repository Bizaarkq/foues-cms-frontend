/**
 * iconForQuickLink — resuelve un LucideIcon por icon slug o label de QuickLink.
 *
 * REQ-ICON: map exportado + fallback a LinkIcon.
 * Acepta el campo ButtonElement.icon (slug de Strapi) con fallback al label.
 * Normalización: trim + lowercase del input.
 */

import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  GraduationCap,
  HeartPulse,
  Home,
  Info,
  Link as LinkIcon,
  Mail,
  MapPin,
  Phone,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Map de slug/label (normalizado) → LucideIcon.
 * Exportado para extensión sin modificar la función.
 */
export const quickLinkIconMap: Record<string, LucideIcon> = {
  // Por icon slug (campo ButtonElement.icon en Strapi)
  book: BookOpen,
  bookopen: BookOpen,
  calendar: Calendar,
  clock: Clock,
  file: FileText,
  filetext: FileText,
  graduationcap: GraduationCap,
  graduation: GraduationCap,
  heartpulse: HeartPulse,
  heart: HeartPulse,
  home: Home,
  info: Info,
  link: LinkIcon,
  mail: Mail,
  map: MapPin,
  mappin: MapPin,
  phone: Phone,
  star: Star,
  users: Users,

  // Por label del mockup (trim + lowercase)
  expedientes: BookOpen,
  "expedientes académicos": BookOpen,
  "expedientes academicos": BookOpen,
  tramites: FileText,
  trámites: FileText,
  "trámites estudiantiles": FileText,
  "tramites estudiantiles": FileText,
  clinicas: HeartPulse,
  clínicas: HeartPulse,
  horarios: Clock,
};

/**
 * Retorna el LucideIcon correspondiente al slug o label recibido.
 * Normaliza (trim + lowercase) antes de buscar.
 * Fallback: LinkIcon si no se encuentra en el mapa.
 */
export function iconForQuickLink(input: string | null | undefined): LucideIcon {
  if (!input) return LinkIcon;
  const key = input.trim().toLowerCase();
  return quickLinkIconMap[key] ?? LinkIcon;
}
