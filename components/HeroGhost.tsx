"use client";

// Cursor-tracking eyes + reactive mouth, ported one-to-one from site.js.
// Lives client-side because it needs mousemove + rAF.
import { useEffect, useRef } from "react";

export default function HeroGhost() {
  const ghostRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const ghost = ghostRef.current;
    if (!ghost) return;
    const eyeL = ghost.querySelector(".eye-l") as SVGGElement | null;
    const eyeR = ghost.querySelector(".eye-r") as SVGGElement | null;
    const mouth = ghost.querySelector(".mouth") as SVGEllipseElement | null;
    if (!eyeL || !eyeR || !mouth) return;

    const MAX_EYE_OFFSET = 1.6;
    const NEAR_DIST_PX = 220;

    let lastMoveT = 0,
      lastMoveX = 0,
      lastMoveY = 0,
      speed = 0;
    let blinkT = 0;
    let mode: "neutral" | "curious" | "startled" | "blink" = "neutral";

    const setMouth = (state: typeof mode) => {
      if (state === "startled") {
        mouth.setAttribute("rx", "2.6");
        mouth.setAttribute("ry", "3.4");
        mouth.setAttribute("cy", "55");
      } else if (state === "curious") {
        mouth.setAttribute("rx", "1.7");
        mouth.setAttribute("ry", "2.2");
        mouth.setAttribute("cy", "54");
      } else {
        mouth.setAttribute("rx", "2.1");
        mouth.setAttribute("ry", "2.7");
        mouth.setAttribute("cy", "54");
      }
    };

    const setEyes = (dx: number, dy: number, blink = false) => {
      const t = `translate(${dx.toFixed(2)} ${dy.toFixed(2)})`;
      if (blink) {
        eyeL.setAttribute("transform", t + " scale(1, 0.08)");
        eyeR.setAttribute("transform", t + " scale(1, 0.08)");
      } else {
        eyeL.setAttribute("transform", t);
        eyeR.setAttribute("transform", t);
      }
    };

    let pendingX = 0,
      pendingY = 0,
      hasPointer = false;

    const onMove = (e: MouseEvent) => {
      hasPointer = true;
      const rect = ghost.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const len = Math.max(dist, 1);
      const nx = dx / len,
        ny = dy / len;
      pendingX = nx * MAX_EYE_OFFSET;
      pendingY = ny * MAX_EYE_OFFSET;

      const now = performance.now();
      const dt = Math.max(now - lastMoveT, 1);
      const moved = Math.hypot(e.clientX - lastMoveX, e.clientY - lastMoveY);
      speed = moved / dt;
      lastMoveT = now;
      lastMoveX = e.clientX;
      lastMoveY = e.clientY;

      let next: typeof mode = "neutral";
      if (speed > 1.5) next = "startled";
      else if (dist < NEAR_DIST_PX) next = "curious";
      if (next !== mode) {
        mode = next;
        setMouth(mode);
      }
      blinkT = now;
    };

    let curX = 0,
      curY = 0,
      raf = 0;
    const tick = () => {
      curX += (pendingX - curX) * 0.18;
      curY += (pendingY - curY) * 0.18;
      const now = performance.now();
      const idleFor = now - (blinkT || now);
      const wantBlink = hasPointer && idleFor > 4500 && idleFor < 4630;
      setEyes(curX, curY, wantBlink);
      if (mode === "startled" && speed < 0.4) {
        mode = "curious";
        setMouth(mode);
      }
      raf = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      pendingX = 0;
      pendingY = 0;
      mode = "neutral";
      setMouth(mode);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <svg
      ref={ghostRef}
      className="hero-mark"
      width="80"
      height="96"
      viewBox="0 0 80 96"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bodyGradHero" cx="35%" cy="22%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#e6e6df" />
          <stop offset="100%" stopColor="#a8a89e" />
        </radialGradient>
        <linearGradient id="rimLightHero" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M 12 42 C 12 23 24.5 8 40 8 C 55.5 8 68 23 68 42 L 68 82 C 68 85.2 65.2 86.6 62.7 84.5 L 57.5 80.2 C 55 78.1 51.5 78.1 49 80.2 L 45 83.6 C 42.5 85.7 37.5 85.7 35 83.6 L 31 80.2 C 28.5 78.1 25 78.1 22.5 80.2 L 17.3 84.5 C 14.8 86.6 12 85.2 12 82 Z"
        fill="url(#bodyGradHero)"
      />
      <path
        d="M 12 42 C 12 23 24.5 8 40 8 C 55.5 8 68 23 68 42 L 68 50 C 68 32 55.5 17 40 17 C 24.5 17 12 32 12 50 Z"
        fill="url(#rimLightHero)"
        opacity="0.5"
      />
      <g className="eye eye-l" style={{ transformOrigin: "30px 40px" }}>
        <ellipse cx="30" cy="40" rx="3.4" ry="4.6" fill="#0a0a0b" />
      </g>
      <g className="eye eye-r" style={{ transformOrigin: "50px 40px" }}>
        <ellipse cx="50" cy="40" rx="3.4" ry="4.6" fill="#0a0a0b" />
      </g>
      <ellipse className="mouth" cx="40" cy="54" rx="2.1" ry="2.7" fill="#0a0a0b" />
      <ellipse cx="40" cy="91" rx="20" ry="1.6" fill="#000" opacity="0.4" />
    </svg>
  );
}
