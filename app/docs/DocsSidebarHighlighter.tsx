"use client";

import { useEffect } from "react";

// Mirrors the IntersectionObserver in site.js — keeps the sidebar
// highlighted in sync with whatever heading is currently in view.
export default function DocsSidebarHighlighter() {
  useEffect(() => {
    const sidebarLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        '.docs-sidebar a[href^="#"]',
      ),
    );
    if (!sidebarLinks.length) return;

    const idToLink = new Map(
      sidebarLinks.map((a) => [a.getAttribute("href")!.slice(1), a]),
    );
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".docs-content h2[id], .docs-content h3[id]",
      ),
    ).filter((h) => idToLink.has(h.id));

    const setActive = (id: string) => {
      sidebarLinks.forEach((a) => a.classList.remove("active"));
      const link = idToLink.get(id);
      if (link) link.classList.add("active");
    };

    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        });
        const order = headings.map((h) => h.id);
        const top = order.find((id) => visible.has(id));
        if (top) setActive(top);
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, []);

  return null;
}
