import Link from "next/link";
import { href, t, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { SITE_NAME } from "@/lib/site";

export default function Footer({ lang }: { lang: Lang }) {
  const d = ts[lang];
  const links: [string, string][] = [
    [href(lang, "/shop"), d.allProducts],
    [href(lang, "/brands"), t[lang].brands],
    [href(lang, "/returns"), t[lang].returns],
    [href(lang, "/track"), "Track order"],
    [href(lang, "/policies/shipping"), "Shipping policy"],
    [href(lang, "/policies/returns"), "Return & refund policy"],
    [href(lang, "/policies/privacy"), "Privacy policy"],
    [href(lang, "/policies/terms"), "Terms of service"],
  ];
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div>
          <p className="text-lg font-bold text-rose-700">{SITE_NAME}</p>
          <p className="mt-2 max-w-sm text-sm text-neutral-600">{d.aboutShop}</p>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-sm">
          {links.map(([to, label]) => <li key={to}><Link href={to} className="hover:underline">{label}</Link></li>)}
        </ul>
      </div>
      <p className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-500">© {new Date().getFullYear()} {SITE_NAME}</p>
    </footer>
  );
}
