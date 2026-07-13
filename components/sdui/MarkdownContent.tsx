import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const VIDEO_EXT = /\.(mp4|webm|ogg|mov)(\?.*)?$/i;

interface MarkdownContentProps {
  content: string;
  /** Wrapper classes; callers provide their own `prose` scale/spacing. */
  className?: string;
}

/**
 * MarkdownContent — shared markdown renderer for richtext block fields.
 *
 * Same pipeline as the RichText block (GFM + raw HTML passthrough + video
 * links rendered as <video>). Extracted so Accordion/Tabs panels render
 * markdown exactly like RichText does. Usable from both server and client
 * components.
 */
export default function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={className}>
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
