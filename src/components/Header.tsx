import Link from "next/link";
import { href, t, type Lang } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import CartButton from "./CartButton";
import DemoBar from "./DemoBar";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks from "./NavLinks";
import SearchBox from "./SearchBox";

export default function Header({ lang, liveEmpty, announcement }: { lang: Lang; liveEmpty: boolean; announcement: string }) {
  const d = t[lang];
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      {announcement && <p className="bg-neutral-900 px-4 py-1.5 text-center text-xs text-white">{announcement}</p>}
      <DemoBar lang={lang} liveEmpty={liveEmpty} labels={d} />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href={href(lang, "/")} className="text-xl font-bold tracking-tight text-rose-700">{SITE_NAME}</Link>
        <SearchBox lang={lang} />
        <div className="ms-auto flex items-center gap-3">
          <LanguageSwitcher current={lang} hint={d.langHint} />
          <CartButton lang={lang} />
        </div>
        <div className="w-full"><NavLinks lang={lang} /></div>
      </div>
    </header>
  );
}
