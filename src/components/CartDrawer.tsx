"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { pkr } from "@/lib/site";

export default function CartDrawer({ lang }: { lang: Lang }) {
  const d = ts[lang];
  const { open, setOpen, lines, subtotal, setQty, remove } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={d.cartTitle}>
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside className="absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">{d.cartTitle}</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label={d.close} className="text-2xl leading-none">×</button>
        </div>

        {lines.length === 0 ? (
          <p className="p-6 text-neutral-500">{d.emptyCart}</p>
        ) : (
          <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto px-4">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-3 py-4">
                <div className="relative h-24 w-18 shrink-0 overflow-hidden rounded bg-neutral-100" style={{ width: 72 }}>
                  {l.image && <Image src={l.image} alt={l.name} fill sizes="72px" className="object-cover" />}
                </div>
                <div className="flex-1 text-sm">
                  <Link href={href(lang, `/products/${l.slug}`, l.demo)} onClick={() => setOpen(false)} className="font-medium hover:underline">{l.name}</Link>
                  <p className="text-xs text-neutral-500">{[l.size, l.color].filter(Boolean).join(" · ")}</p>
                  <p className="mt-1">{pkr(l.price)}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center rounded border border-neutral-300">
                      <button type="button" className="px-2 py-1" onClick={() => setQty(l.key, l.qty - 1)} aria-label="−">−</button>
                      <span className="w-6 text-center">{l.qty}</span>
                      <button type="button" className="px-2 py-1" onClick={() => setQty(l.key, l.qty + 1)} aria-label="+">+</button>
                    </div>
                    <button type="button" onClick={() => remove(l.key)} className="text-xs text-neutral-500 underline">{d.remove}</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 p-4">
          <p className="flex justify-between font-medium"><span>{d.subtotal}</span><span>{pkr(subtotal)}</span></p>
          <p className="mt-1 text-xs text-neutral-500">{d.shippingAtCheckout}</p>
          <div className="mt-3 grid gap-2">
            <Link href={href(lang, "/checkout")} onClick={() => setOpen(false)} aria-disabled={lines.length === 0} className={`rounded bg-neutral-900 py-3 text-center text-sm font-semibold uppercase text-white ${lines.length === 0 ? "pointer-events-none opacity-40" : ""}`}>{d.checkout}</Link>
            <Link href={href(lang, "/cart")} onClick={() => setOpen(false)} className="rounded border border-neutral-300 py-3 text-center text-sm">{d.viewCart}</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
