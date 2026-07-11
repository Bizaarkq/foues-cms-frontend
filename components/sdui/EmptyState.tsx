import type { LucideIcon as LucideIconType } from "lucide-react";

/**
 * EmptyState — estado vacío consistente para bloques SDUI.
 * Ícono + mensaje muted con padding generoso; reemplaza los textos pelados
 * tipo "No hay contenido disponible".
 */
export function EmptyState({
  icon: Icon,
  message,
}: {
  icon: LucideIconType;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-foues-accent) 12%, transparent)",
        }}
        aria-hidden="true"
      >
        <Icon className="h-6 w-6 text-[var(--color-foues-accent)]" />
      </span>
      <p className="text-sm text-[var(--color-foues-text-muted)]">{message}</p>
    </div>
  );
}
