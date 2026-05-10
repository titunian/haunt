interface Props {
  source: string;
  size?: number;
  className?: string;
}

/**
 * Tiny monochrome glyphs that ride alongside the source name in the row.
 * Differentiation comes from shape, never color — keeps our "phosphor green
 * is the only accent" rule intact.
 */
export default function SourceIcon({ source, size = 11, className }: Props) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    className,
    style: { flexShrink: 0 },
  };
  switch (source) {
    case "claude":
      // Anthropic's "A" — official path from simpleicons (CC0).
      return (
        <svg {...props}>
          <path
            d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"
            fill="currentColor"
          />
        </svg>
      );
    case "codex":
      // Hexagonal mark — geometric, drawn fresh.
      return (
        <svg {...props}>
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3.2 L19.6 7.6 V16.4 L12 20.8 L4.4 16.4 V7.6 Z" />
            <path d="M12 8 L16 10.3 V14.7 L12 17 L8 14.7 V10.3 Z" />
          </g>
        </svg>
      );
    case "cursor":
      // Folded triangle — official path from simpleicons (CC0).
      return (
        <svg {...props}>
          <path
            d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"
            fill="currentColor"
          />
        </svg>
      );
    default:
      // Generic "session" mark — a small circle.
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="6" fill="currentColor" opacity="0.6" />
        </svg>
      );
  }
}
