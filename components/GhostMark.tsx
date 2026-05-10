// Thin wrapper around the symbol in <GhostDefs />. Use anywhere you'd put
// the brand glyph (nav, sign-in card, empty states, footer).
export default function GhostMark({
  size = 16,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const w = size;
  const h = Math.round(size * (96 / 80));
  return (
    <svg
      className={className}
      width={w}
      height={h}
      viewBox="0 0 80 96"
      aria-hidden="true"
    >
      <use href="#ghost" />
    </svg>
  );
}
