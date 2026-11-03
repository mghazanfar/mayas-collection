"use client";

import Link from "next/link";
import { href, t, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { useIsDemo } from "./DemoBar";

export default function NavLinks({ lang }: { lang: Lang }) {
  const demo = useIsDemo();
  const items: [string, string][] = [
    [href(lang, "/shop", demo), ts[lang].allProducts],
    [href(lang, "/brands", demo), t[lang].brands],
    [href(lang, "/returns"), t[lang].returns],
    [href(lang, "/track"), lang === "ur" ? "آرڈر ٹریک" : lang === "roman" ? "Order track" : "Track order"],
  ];
  return (
    <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium">
      {items.map(([to, label]) => <Link key={to} href={to} className="hover:text-rose-700">{label}</Link>)}
    </nav>
  );
}
