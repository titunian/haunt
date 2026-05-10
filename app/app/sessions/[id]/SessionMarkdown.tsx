import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import type { Components } from "react-markdown";

interface Props {
  body: string;
}

const components: Components = {
  // Turn boundaries — `### User · 14:08:12` / `### Assistant · 14:08:12`
  // Renders as a tighter section header with a colored eyebrow.
  h3({ children, ...props }) {
    const text = String(Array.isArray(children) ? children.join("") : children ?? "");
    const m = text.match(/^(User|Assistant)\s*·\s*(.+)$/);
    if (m) {
      const [, role, when] = m;
      const cls = role.toLowerCase() === "user" ? "turn-user" : "turn-assistant";
      return (
        <h3 className={`session-md-turn ${cls}`} {...props}>
          <span className="session-md-turn-role">{role}</span>
          <span className="session-md-turn-time">· {when}</span>
        </h3>
      );
    }
    return <h3 {...props}>{children}</h3>;
  },
  // Tool call cards: `**Tool · Bash** — \`command\``
  p({ children, ...props }) {
    const arr = Array.isArray(children) ? children : [children];
    const first = arr[0] as
      | { type?: string; props?: { children?: unknown } }
      | undefined;
    if (first && typeof first === "object" && first.type === "strong") {
      const inner = first.props?.children;
      const strongText = String(
        Array.isArray(inner) ? inner.join("") : inner ?? "",
      );
      if (strongText.startsWith("Tool · ")) {
        return (
          <p className="session-md-tool" {...props}>
            {children}
          </p>
        );
      }
    }
    return <p {...props}>{children}</p>;
  },
  hr() {
    return <hr className="session-md-rule" />;
  },
  blockquote({ children, ...props }) {
    return (
      <blockquote className="session-md-quote" {...props}>
        {children}
      </blockquote>
    );
  },
};

export default function SessionMarkdown({ body }: Props) {
  return (
    <div className="session-md">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
