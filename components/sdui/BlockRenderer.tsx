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
}

export function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <>
      {blocks.map((block, index) => {
        const Component = blockRegistry[block.__component];
        if (!Component) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <Component key={`${block.__component}-${index}`} {...(block as any)} />;
      })}
    </>
  );
}
