"use client";

import { useCart } from "@/lib/cart";
import type { Lang } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";

export default function CartButton({ lang }: { lang: Lang }) {
  const { count, ready, setOpen } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} aria-label={`${ts[lang].cartTitle}${ready && count ? ` (${count})` : ""}`} className="relative rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium hover:bg-neutral-100">
      🛍 {t[lang].cart}
      {ready && count > 0 && <span className="absolute -end-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-700 px-1 text-xs font-bold text-white">{count}</span>}
    </button>
  );
}
