"use client";

import { Accordion } from "@skeletonlabs/skeleton-react";
import { ChevronDown } from "lucide-react";
import type { AccordionBlockProps } from "@/types/blocks";
import MarkdownContent from "../MarkdownContent";

/**
 * AccordionBlock — curated wrapper around Skeleton (Zag.js) Accordion.
 * Panel content is markdown, rendered with the same pipeline as RichText.
 * Empty state: no items → renders nothing.
 */
export default function AccordionBlock({ title, items }: AccordionBlockProps) {
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

        <Accordion collapsible multiple className="w-full">
          {items.map((item, i) => (
            <Accordion.Item
              key={i}
              value={`item-${i}`}
              className="border-b"
              style={{ borderColor: "var(--color-foues-border-subtle)" }}
            >
              <Accordion.ItemTrigger className="group flex w-full items-center justify-between gap-4 py-4 text-left">
                <span
                  className="text-base font-semibold sm:text-lg"
                  style={{ color: "var(--color-foues-navy)" }}
                >
                  {item.label}
                </span>
                <Accordion.ItemIndicator className="shrink-0 transition-transform duration-200 group-aria-expanded:rotate-180">
                  <ChevronDown
                    className="h-5 w-5"
                    style={{ color: "var(--color-foues-accent)" }}
                    aria-hidden="true"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent className="pb-5">
                <MarkdownContent
                  content={item.content}
                  className="prose max-w-none text-[var(--color-foues-text-body)]"
                />
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
