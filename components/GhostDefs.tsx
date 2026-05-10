// One copy of the ghost / apple / external-arrow symbols, lifted from the
// original index.html. Mounted once at <body> root so any component below can
// `<svg><use href="#ghost"/></svg>` it without re-defining the gradients.
export default function GhostDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <radialGradient id="bodyGrad" cx="35%" cy="22%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e6e6df" />
          <stop offset="100%" stopColor="#a8a89e" />
        </radialGradient>
        <linearGradient id="rimLight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <symbol id="ghost" viewBox="0 0 80 96">
          <path
            d="M 12 42 C 12 23 24.5 8 40 8 C 55.5 8 68 23 68 42 L 68 82 C 68 85.2 65.2 86.6 62.7 84.5 L 57.5 80.2 C 55 78.1 51.5 78.1 49 80.2 L 45 83.6 C 42.5 85.7 37.5 85.7 35 83.6 L 31 80.2 C 28.5 78.1 25 78.1 22.5 80.2 L 17.3 84.5 C 14.8 86.6 12 85.2 12 82 Z"
            fill="url(#bodyGrad)"
          />
          <path
            d="M 12 42 C 12 23 24.5 8 40 8 C 55.5 8 68 23 68 42 L 68 50 C 68 32 55.5 17 40 17 C 24.5 17 12 32 12 50 Z"
            fill="url(#rimLight)"
            opacity="0.5"
          />
          <ellipse cx="30" cy="40" rx="3.4" ry="4.6" fill="#0a0a0b" />
          <ellipse cx="50" cy="40" rx="3.4" ry="4.6" fill="#0a0a0b" />
          <ellipse cx="40" cy="54" rx="2.1" ry="2.7" fill="#0a0a0b" />
          <ellipse cx="40" cy="91" rx="20" ry="1.6" fill="#000" opacity="0.4" />
        </symbol>
        <symbol id="apple" viewBox="0 0 16 16">
          <path
            d="M11.18 8.45c0-1.96 1.6-2.9 1.67-2.95-.92-1.34-2.34-1.52-2.84-1.54-1.21-.13-2.36.71-2.97.71-.61 0-1.56-.7-2.57-.68-1.32.02-2.55.77-3.23 1.96-1.38 2.39-.35 5.93.99 7.88.66.95 1.43 2.02 2.44 1.98.98-.04 1.35-.63 2.54-.63 1.18 0 1.52.63 2.55.61 1.05-.02 1.72-.97 2.36-1.93.74-1.11 1.05-2.18 1.07-2.24-.02-.01-2.05-.79-2.07-3.13zM9.31 2.96c.54-.65.9-1.56.8-2.46-.78.03-1.71.52-2.27 1.17-.5.57-.94 1.49-.82 2.38.86.07 1.75-.44 2.29-1.09z"
            fill="currentColor"
          />
        </symbol>
        <symbol id="arrow-out" viewBox="0 0 16 16">
          <path
            d="M5 4h7v7M5 12L12 5"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}
