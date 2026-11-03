"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, type Lang } from "@/lib/i18n";

export function useIsDemo(): boolean {
  const pathname = usePathname() || "/";
  return /^(\/(en|roman|ur))?\/demo(\/|$)/.test(pathname);
}

type Labels = { liveEmpty: string; viewDemo: string; demoBanner: string; backToLive: string };

// Shown only while the live catalog is empty (or while browsing /demo).
export default function DemoBar({ lang, liveEmpty, labels }: { lang: Lang; liveEmpty: boolean; labels: Labels }) {
  const demo = useIsDemo();
  if (!demo && !liveEmpty) return null;

  return (
    <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">
      {demo ? (
        <>
          {labels.demoBanner}{" "}
          <Link href={href(lang, "/")} className="font-semibold underline">
            {labels.backToLive}
          </Link>
        </>
      ) : (
        <>
          {labels.liveEmpty}{" "}
          <Link href={href(lang, "/", true)} className="font-semibold underline">
            {labels.viewDemo}
          </Link>
        </>
      )}
    </div>
  );
}
