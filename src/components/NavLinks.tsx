"use client";

import Link from "next/link";
import { href, type Lang } from "@/lib/i18n";
import { useIsDemo } from "./DemoBar";

export default function NavLinks({ lang, labels }: { lang: Lang; labels: { brands: string; returns: string; cart: string } }) {
  const demo = useIsDemo();
  return (
    <nav className="flex items-center gap-5 text-sm font-medium">
      <Link href={href(lang, "/brands", demo)}>{labels.brands}</Link>
      <Link href={href(lang, "/returns")}>{labels.returns}</Link>
      <Link href={href(lang, "/cart")}>{labels.cart}</Link>
    </nav>
  );
}
