/**
 * app/not-found.tsx — 404 for unknown routes (and explicit notFound() calls
 * from the catch-all). Renders inside the root layout, so the theme vars
 * from ThemeVars are available and dark mode just works.
 */

import type { Metadata } from "next";
import { ErrorScreen } from "@/components/ErrorScreen";

export const metadata: Metadata = {
  title: "Página no encontrada — FOUES",
};

export default function NotFound() {
  return (
    <ErrorScreen
      code="404"
      eyebrow="Página no encontrada"
      title="Esta página no existe"
      message="La dirección que buscás no existe o fue movida. Revisá el enlace, o volvé al inicio y navegá desde el menú."
    />
  );
}
