"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { pkr } from "@/lib/site";

export default function CartPage({ lang }: { lang: Lang }) {
  const d = ts[lang];
  const { lines, ready, subtotal, setQty, remove } = useCart();
  const hasDemo = lines.some((l) => l.demo);

  if (!ready) return <p className="py-16 text-center text-neutral-400">…</p>;
  if (lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-600">{d.emptyCart}</p>
        <Link href={href(lang, "/shop")} className="mt-4 inline-block rounded bg-neutral-900 px-6 py-3 text-sm font-semibold text-white">{d.continueShopping}</Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.6fr_1fr]">
      <ul className="divide-y divide-neutral-200">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-4 py-5">
            <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded bg-neutral-100">
              {l.image && <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" />}
            </div>
            <div className="flex-1 text-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">{l.brandName}</p>
              <Link href={href(lang, `/products/${l.slug}`, l.demo)} className="font-medium hover:underline">{l.name}</Link>
              <p className="text-neutral-500">{[l.size, l.color].filter(Boolean).join(" · ")}</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center rounded border border-neutral-300">
                  <button type="button" className="px-3 py-1.5" onClick={() => setQty(l.key, l.qty - 1)} aria-label="−">−</button>
                  <span className="w-8 text-center">{l.qty}</span>
                  <button type="button" className="px-3 py-1.5" onClick={() => setQty(l.key, l.qty + 1)} aria-label="+">+</button>
                </div>
                <button type="button" onClick={() => remove(l.key)} className="text-xs text-neutral-500 underline">{d.remove}</button>
              </div>
            </div>
            <p className="text-sm font-medium">{pkr(l.price * l.qty)}</p>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-lg border border-neutral-200 p-5">
        <p className="flex justify-between font-semibold"><span>{d.subtotal}</span><span>{pkr(subtotal)}</span></p>
        <p className="mt-2 text-xs text-neutral-500">{d.shippingAtCheckout}</p>
        {hasDemo && <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-900">{d.demoOrderNote}</p>}
        <Link href={href(lang, "/checkout")} className="mt-4 block rounded bg-neutral-900 py-3 text-center text-sm font-semibold uppercase text-white hover:bg-neutral-700">{d.checkout}</Link>
        <Link href={href(lang, "/shop")} className="mt-2 block text-center text-sm underline">{d.continueShopping}</Link>
      </aside>
    </div>
  );
}
