"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
  initial: string;
}

/**
 * Debounced search input. Updates the URL ~250ms after the user stops typing,
 * so server-side filtering re-renders without a form submit. Cmd+K / Ctrl+K
 * focuses the input from anywhere on the page.
 */
export default function LiveSearch({ initial }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastSubmitted = useRef(initial);

  // Cmd+K / Ctrl+K and `/` focus the input from anywhere
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const cmdK = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k";
      const slash =
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement);
      if (cmdK || slash) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced URL update
  useEffect(() => {
    if (value === lastSubmitted.current) return;
    const t = setTimeout(() => {
      const next = value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");
      const qs = params.toString();
      lastSubmitted.current = next;
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    }, 250);
    return () => clearTimeout(t);
  }, [value, pathname, searchParams, router]);

  return (
    <div className="filter-search-form">
      <span className="filter-search-icon" aria-hidden="true">
        ⌕
      </span>
      <input
        ref={inputRef}
        type="search"
        name="q"
        placeholder="Search session titles…  (⌘K)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
        className="filter-search"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <button
          type="button"
          className="filter-search-clear"
          aria-label="Clear search"
          onClick={() => setValue("")}
        >
          ×
        </button>
      )}
    </div>
  );
}
