import type { MapProps } from "@/types/blocks";

export default function MapBlock({ title, address, embed_url }: MapProps) {
  if (!embed_url) return null;
  return (
    <section className="my-8">
      {title ? (
        <h2
          className="text-xl font-semibold mb-2"
          style={{ color: "var(--color-foues-navy)" }}
        >
          {title}
        </h2>
      ) : null}
      {address ? (
        <p className="text-sm text-[var(--color-foues-text-secondary)] mb-4">{address}</p>
      ) : null}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-[var(--color-foues-border-subtle)]">
        <iframe
          src={embed_url}
          title={title ?? "Mapa"}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups"
          allowFullScreen
        />
      </div>
    </section>
  );
}
