"use client";

import { useState } from "react";

export default function CopyButton({
  value,
  label = "Copy",
  className = "copy-btn",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <button
      type="button"
      className={`${className} ${state === "copied" ? "copied" : ""}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setState("copied");
          setTimeout(() => setState("idle"), 1400);
        } catch {
          setState("failed");
          setTimeout(() => setState("idle"), 1400);
        }
      }}
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Failed" : label}
    </button>
  );
}
