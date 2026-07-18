/**
 * BlockRenderer — iterates blocks[] and dispatches each to its registered component.
 *
 * REQ-N03: Unknown __component values render nothing (null), no error thrown.
 * Decision #3: Registry map lookup is O(1).
 */

import { blockRegistry } from "./registry";
import type { SDUIBlock } from "@/types/blocks";

interface BlockRendererProps {
  blocks: SDUIBlock[];
  /**
   * Path of the page being rendered (e.g. "/quienes-somos/revista").
   * Injected into every block as an extra prop so location-aware blocks
   * (magazine-archive, article-list) can build links relative to where they live.
   */
  pagePath?: string;
  /**
   * 1-based page number when rendering a virtual `{pagePath}/pagina/{n}`
   * child path. Injected into every block (article-list paginates on it).
   */
  pageNumber?: number;
}

export function BlockRenderer({ blocks, pagePath, pageNumber = 1 }: BlockRendererProps) {
  return (
    <>
      {blocks.map((block, index) => {
        const Component = blockRegistry[block.__component];
        if (!Component) return null;
        return (
          <Component
            key={`${block.__component}-${index}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...(block as any)}
            pagePath={pagePath}
            pageNumber={pageNumber}
          />
        );
      })}
    </>
  );
}
