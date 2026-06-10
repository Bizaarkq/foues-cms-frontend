import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { RichTextProps } from "@/types/blocks";

const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

export default function RichText({ content }: RichTextProps) {
  if (!content) return null;

  return (
    <div className="prose prose-lg max-w-none px-4 py-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a({ href, children, ...props }) {
            if (href && VIDEO_EXT.test(href)) {
              return (
                <video
                  controls
                  preload="metadata"
                  className="w-full rounded-lg my-4"
                >
                  <source src={href} />
                  {children}
                </video>
              );
            }
            return (
              <a href={href} {...props} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
