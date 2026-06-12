"use client";

/**
 * FlipbookClient — browser-side flipbook renderer.
 *
 * Wraps react-pageflip's HTMLFlipBook with:
 *  - Windowed lazy rendering: only the ±WINDOW_RADIUS pages around the
 *    current page have live <img> elements; the rest render an empty
 *    placeholder div. Keeps the DOM lean for issues with 100+ pages.
 *  - Visit beacon: fires once on mount via fetch POST to /api/magazine-track.
 *  - Depth beacon: fires on the `pagehide` window event via fetch keepalive,
 *    reporting maxPercent (deepest page reached, 0-100).
 *
 * All props must be serialisable — URLs are resolved to absolute by
 * MagazineViewer before crossing the server → client boundary.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
// react-pageflip is SSR-safe (all DOM access inside useEffect).
// We cast it to a looser props interface because the library's TypeScript
// definitions mark all IFlipSetting fields as required even though the
// runtime provides defaults for most of them.
import HTMLFlipBookRaw from "react-pageflip";

// ---------------------------------------------------------------------------
// Local prop shape — all IFlipSetting fields optional except width/height
// ---------------------------------------------------------------------------

interface FlipBookProps {
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
  width: number;
  height: number;
  size?: "fixed" | "stretch";
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  startPage?: number;
  drawShadow?: boolean;
  flippingTime?: number;
  usePortrait?: boolean;
  startZIndex?: number;
  autoSize?: boolean;
  maxShadowOpacity?: number;
  showCover?: boolean;
  mobileScrollSupport?: boolean;
  clickEventForward?: boolean;
  useMouseEvents?: boolean;
  swipeDistance?: number;
  showPageCorners?: boolean;
  disableFlipByClick?: boolean;
  renderOnlyPageLengthChange?: boolean;
  onFlip?: (e: { data: number }) => void;
}

// Cast away the strict required-field interface from the library types
const HTMLFlipBook = HTMLFlipBookRaw as unknown as React.ComponentType<FlipBookProps>;

// ---------------------------------------------------------------------------
// Page shape (URLs already resolved to absolute by MagazineViewer)
// ---------------------------------------------------------------------------

export interface ResolvedPage {
  url: string;
  width: number | null;
  height: number | null;
}

// Only pages within ±WINDOW_RADIUS of currentPage get a real <img> element.
const WINDOW_RADIUS = 2;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FlipbookClientProps {
  documentId: string;
  pages: ResolvedPage[];
}

export function FlipbookClient({ documentId, pages }: FlipbookClientProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const maxPageRef = useRef(0);

  // Visit beacon — fires once on mount
  useEffect(() => {
    fetch("/api/magazine-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId, type: "visit" }),
    }).catch(() => {
      // Fire-and-forget: never surface tracking errors to the reader
    });
  }, [documentId]);

  // Depth beacon — fires when the user leaves the page
  useEffect(() => {
    const handlePagehide = () => {
      const total = pages.length;
      if (total === 0) return;
      // Convert 0-based maxPage index to percentage of magazine viewed
      const maxPercent = Math.min(
        100,
        Math.round(((maxPageRef.current + 1) / total) * 100)
      );
      fetch("/api/magazine-track", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, type: "depth", maxPercent }),
      }).catch(() => {});
    };

    window.addEventListener("pagehide", handlePagehide);
    return () => window.removeEventListener("pagehide", handlePagehide);
  }, [documentId, pages.length]);

  // Flip handler — updates currentPage state (triggers windowed re-render)
  const handleFlip = useCallback((e: { data: number }) => {
    const page = e.data;
    setCurrentPage(page);
    if (page > maxPageRef.current) {
      maxPageRef.current = page;
    }
  }, []);

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <p style={{ color: "var(--color-foues-text-muted)" }}>
          Esta edición no tiene páginas disponibles.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      {/* Page counter */}
      <p
        className="text-sm font-medium"
        style={{ color: "var(--color-foues-text-secondary)" }}
        aria-live="polite"
      >
        Página {currentPage + 1} de {pages.length}
      </p>

      {/* Flipbook */}
      <div className="w-full flex justify-center overflow-hidden">
        <HTMLFlipBook
          className=""
          style={{}}
          width={500}
          height={700}
          size="stretch"
          minWidth={280}
          maxWidth={1000}
          minHeight={350}
          maxHeight={1400}
          startPage={0}
          drawShadow
          flippingTime={700}
          usePortrait
          startZIndex={0}
          autoSize
          maxShadowOpacity={0.5}
          showCover={false}
          mobileScrollSupport
          clickEventForward
          useMouseEvents
          swipeDistance={30}
          showPageCorners
          disableFlipByClick={false}
          onFlip={handleFlip}
        >
          {pages.map((page, i) => {
            const inWindow = Math.abs(i - currentPage) <= WINDOW_RADIUS;
            return (
              <div
                key={i}
                className="bg-white w-full h-full flex items-center justify-center overflow-hidden"
              >
                {inWindow ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={page.url}
                    alt={`Página ${i + 1}`}
                    className="w-full h-full object-contain"
                    width={page.width ?? undefined}
                    height={page.height ?? undefined}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: "var(--color-foues-surface-sunken)" }}
                    aria-hidden="true"
                  />
                )}
              </div>
            );
          })}
        </HTMLFlipBook>
      </div>

      {/* Navigation hint */}
      <p
        className="text-xs text-center"
        style={{ color: "var(--color-foues-text-muted)" }}
      >
        Usá las flechas del teclado o arrastrá las páginas para navegar
      </p>
    </div>
  );
}
