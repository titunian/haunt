"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface Props {
  options: string[];
  selected: string | null;
}

/**
 * Auto-submitting project filter. Updates the URL via router.replace so
 * back/forward works and the rest of the page is RSC-rendered as usual.
 */
export default function ProjectSelect({ options, selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <select
      name="project"
      defaultValue={selected ?? ""}
      className="filter-select"
      disabled={pending}
      onChange={(e) => {
        const params = new URLSearchParams(search.toString());
        if (e.target.value) params.set("project", e.target.value);
        else params.delete("project");
        const qs = params.toString();
        startTransition(() => {
          router.replace(qs ? `${pathname}?${qs}` : pathname);
        });
      }}
    >
      <option value="">all projects</option>
      {options.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}
