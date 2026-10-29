"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, type Lang } from "@/lib/i18n";

const OPTIONS: { lang: Lang; label: string; highlight?: boolean }[] = [
  { lang: "en", label: "English" },
  { lang: "roman", label: "Roman Urdu", highlight: true },
  { lang: "ur", label: "اردو" },
];

export default function LanguageSwitcher({ current, hint }: { current: Lang; hint: string }) {
  const pathname = usePathname() || "/";
  const rest = pathname.replace(/^\/(roman|ur)(?=\/|$)/, "") || "/";

  return (
    <div className="flex items-center gap-1.5" aria-label="Language">
      {OPTIONS.map((o) => {
        const active = o.lang === current;
        return (
          <Link
            key={o.lang}
            href={href(o.lang, rest)}
            hrefLang={o.lang === "en" ? "en" : o.lang === "roman" ? "ur-Latn" : "ur"}
            title={o.highlight ? hint : undefined}
            aria-current={active ? "true" : undefined}
            className={[
              "rounded-full px-3 py-1 text-sm transition",
              o.highlight
                ? "bg-rose-600 font-semibold text-white shadow ring-2 ring-rose-300 hover:bg-rose-700"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100",
              active && !o.highlight ? "bg-neutral-900 text-white hover:bg-neutral-900" : "",
              active && o.highlight ? "ring-rose-500" : "",
            ].join(" ")}
          >
            {o.label}
          </Link>
        );
      })}
    </div>
  );
}
