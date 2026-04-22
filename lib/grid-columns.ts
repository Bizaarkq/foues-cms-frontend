import type { ContentGridColumns, PhotoGalleryColumns } from "@/types/blocks";

export function contentGridCols(col: ContentGridColumns): string {
  switch (col) {
    case "col_1": return "grid grid-cols-1";
    case "col_2": return "grid grid-cols-1 sm:grid-cols-2";
    case "col_3": return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    case "col_4": return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
  }
}

export function photoGridCols(col: PhotoGalleryColumns): string {
  switch (col) {
    case "col_2": return "grid grid-cols-1 sm:grid-cols-2";
    case "col_3": return "grid grid-cols-2 lg:grid-cols-3";
    case "col_4": return "grid grid-cols-2 lg:grid-cols-4";
  }
}
