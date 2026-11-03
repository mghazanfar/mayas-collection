import Link from "next/link";
import { href, t, type Lang } from "@/lib/i18n";
import { SITE_NAME } from "@/lib/site";
import DemoBar from "./DemoBar";
import LanguageSwitcher from "./LanguageSwitcher";
import NavLinks from "./NavLinks";

export default function Header({ lang, liveEmpty }: { lang: Lang; liveEmpty: boolean }) {
  const d = t[lang];
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <DemoBar lang={lang} liveEmpty={liveEmpty} labels={d} />
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href={href(lang, "/")} className="text-xl font-bold tracking-tight text-rose-700">
          {SITE_NAME}
        </Link>
        <NavLinks lang={lang} labels={d} />
        <LanguageSwitcher current={lang} hint={d.langHint} />
      </div>
    </header>
  );
}
