import Link from "next/link";
import { href, t, type Lang } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({ lang }: { lang: Lang }) {
  const d = t[lang];
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={href(lang, "/")} className="text-xl font-bold tracking-tight text-rose-700">
          {SITE_NAME}
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href={href(lang, "/brands")}>{d.brands}</Link>
          <Link href={href(lang, "/returns")}>{d.returns}</Link>
          <Link href={href(lang, "/cart")}>{d.cart}</Link>
        </nav>
        <LanguageSwitcher current={lang} hint={d.langHint} />
      </div>
    </header>
  );
}
