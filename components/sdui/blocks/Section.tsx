/**
 * Section — SDUI container block for blocks.section.
 *
 * Server component (no 'use client'). Iterates BlockGroupContent[] and
 * delegates each group's blocks to BlockRenderer.
 *
 * REQ-9: render children via BlockRenderer.
 * REQ-10: deep_children → console.warn only, no structural render.
 * REQ-11: aislamiento — does NOT modify any of the 19 existing block renderers.
 *
 * ADR-4: deep_children is typed as unknown; only logged, never rendered.
 */

import { BlockRenderer } from "@/components/sdui/BlockRenderer";
import { sectionColSpan } from "@/lib/grid-columns";
import type { SectionProps } from "@/types/blocks";

export default function Section({ name, section_columns, children, pagePath, pageNumber }: SectionProps) {
  if (!children || children.length === 0) return null;

  return (
    <section
      data-sdui-section={name ?? undefined}
      className={`grid grid-cols-12 ${sectionColSpan(section_columns)}`}
    >
      {children.map((group) => (
        <div
          key={group.id}
          data-sdui-group={group.name ?? undefined}
          className={sectionColSpan(group.group_columns)}
        >
          <BlockRenderer blocks={group.blocks} pagePath={pagePath} pageNumber={pageNumber} />
        </div>
      ))}
    </section>
  );
}
