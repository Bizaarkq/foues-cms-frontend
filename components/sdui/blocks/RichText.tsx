import type { RichTextProps } from "@/types/blocks";

export default function RichText(_props: RichTextProps) {
  return (
    <div className="p-4 my-2 border-2 border-dashed border-gray-400 rounded">
      <code className="text-sm text-gray-500">[stub] blocks.rich-text</code>
    </div>
  );
}
