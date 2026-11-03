"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { useIsDemo } from "./DemoBar";

export default function SearchBox({ lang }: { lang: Lang }) {
  const router = useRouter();
  const demo = useIsDemo();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const term = q.trim();
        if (term) router.push(`${href(lang, "/search", demo)}?q=${encodeURIComponent(term)}`);
      }}
      className="flex-1 sm:max-w-xs"
    >
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={ts[lang].searchPlaceholder}
        aria-label={ts[lang].search}
        className="w-full rounded-full border border-neutral-300 px-4 py-1.5 text-sm"
      />
    </form>
  );
}
