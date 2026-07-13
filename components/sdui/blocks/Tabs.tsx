"use client";

import { Tabs } from "@skeletonlabs/skeleton-react";
import type { TabsBlockProps } from "@/types/blocks";
import MarkdownContent from "../MarkdownContent";

const PANEL_PROSE = "prose max-w-none text-[var(--color-foues-text-body)]";

/**
 * TabsBlock — curated wrapper around Skeleton (Zag.js) Tabs.
 * First tab active by default; content is markdown rendered like RichText.
 * Empty state: no items → nothing; one item → plain section without tab bar.
 */
export default function TabsBlock({ title, items }: TabsBlockProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="w-full py-16 bg-[var(--color-foues-surface)]">
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
              className="mt-2 block h-1 w-16 rounded-full"
              style={{ backgroundColor: "var(--color-foues-accent)" }}
              aria-hidden="true"
            />
          </div>
        )}

        {items.length === 1 ? (
          // Single item: plain section, no tab bar.
          <div>
            <h3
              className="mb-4 text-lg font-semibold"
              style={{ color: "var(--color-foues-navy)" }}
            >
              {items[0].label}
            </h3>
            <MarkdownContent content={items[0].content} className={PANEL_PROSE} />
          </div>
        ) : (
          <Tabs defaultValue="tab-0">
            <Tabs.List
              aria-label={title ?? "Pestañas de contenido"}
              className="flex flex-wrap gap-1 overflow-x-auto border-b"
              style={{ borderColor: "var(--color-foues-border-subtle)" }}
            >
              {items.map((item, i) => (
                <Tabs.Trigger
                  key={i}
                  value={`tab-${i}`}
                  className="whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-semibold transition-colors text-[var(--color-foues-text-secondary)] hover:text-[var(--color-foues-navy)] aria-selected:border-[var(--color-foues-accent)] aria-selected:text-[var(--color-foues-navy)]"
                >
                  {item.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
            {items.map((item, i) => (
              <Tabs.Content key={i} value={`tab-${i}`} className="pt-6">
                <MarkdownContent content={item.content} className={PANEL_PROSE} />
              </Tabs.Content>
            ))}
          </Tabs>
        )}
      </div>
    </section>
  );
}
