import type { RichTextProps } from "@/types/blocks";
import MarkdownContent from "../MarkdownContent";

export default function RichText({ content }: RichTextProps) {
  if (!content) return null;

  return (
    <MarkdownContent
      content={content}
      className="prose prose-lg max-w-none px-4 py-6"
    />
  );
}
