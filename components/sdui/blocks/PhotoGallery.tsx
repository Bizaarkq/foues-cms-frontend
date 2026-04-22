import Image from "next/image";
import type { PhotoGalleryProps } from "@/types/blocks";
import { mediaUrl, mediaAlt } from "@/lib/media";

export default function PhotoGallery({ title, subtitle, images, photo_columns }: PhotoGalleryProps) {
  // Mapa de columnas masonry
  const colsMap: Record<string, string> = {
    col_2: "columns-2",
    col_3: "columns-3",
    col_4: "columns-4",
  };
  const colsClass = colsMap[photo_columns] ?? "columns-3";

  return (
    <section
      className="w-full border-t-4 bg-white py-16"
      style={{ borderTopColor: "var(--color-foues-navy)" }}
    >
      <div className="max-w-[1920px] mx-auto px-6">
        {title && (
          <div className="mb-10">
            <h2
              className="text-2xl font-bold uppercase tracking-wider sm:text-3xl"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {title}
            </h2>
            <span
              className="mt-2 block h-1 w-24"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
            {subtitle && (
              <p className="mt-4 max-w-3xl text-base text-gray-600">{subtitle}</p>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className={`${colsClass} gap-5`}>
            {images.map((img, i) => {
              const url = mediaUrl(img);
              if (!url) return null;
              return (
                <div
                  key={img.documentId ?? i}
                  className="mb-5 break-inside-avoid overflow-hidden shadow-md bg-gray-200"
                >
                  <Image
                    src={url}
                    alt={mediaAlt(img, "")}
                    width={img.width ?? 600}
                    height={img.height ?? 400}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="w-full object-cover"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
