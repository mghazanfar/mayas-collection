"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MAX_QTY, useCart } from "@/lib/cart";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { availableSizes, discountPct, isDemoId, isPurchasable, type Product } from "@/lib/product-types";
import { pkr } from "@/lib/site";

export default function ProductDetail({ product: p, lang, demo }: { product: Product; lang: Lang; demo: boolean }) {
  const d = ts[lang];
  const cart = useCart();
  const [active, setActive] = useState(0);
  const [color, setColor] = useState<string | null>(p.colors[0]?.name ?? null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [lightbox, setLightbox] = useState(false);
  const [error, setError] = useState("");

  const n = p.images.length;
  const go = useCallback((i: number) => setActive(((i % n) + n) % n), [n]);
  const pct = discountPct(p);
  const purchasable = isPurchasable(p);
  const needsSize = p.sizes.length > 0;

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(active + 1);
      if (e.key === "ArrowLeft") go(active - 1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, active, go]);

  function pickColor(name: string) {
    setColor(name);
    const idx = p.colorImages[name];
    if (typeof idx === "number" && idx >= 0 && idx < n) setActive(idx);
  }

  function addToCart() {
    if (needsSize && !size) {
      setError(d.sizeRequired);
      return;
    }
    setError("");
    cart.add(
      {
        productId: p.id,
        slug: p.slug,
        name: p.name,
        brandName: p.brandName,
        image: p.images[(color && p.colorImages[color]) || 0] ?? p.images[0] ?? null,
        price: p.sellPrice,
        size,
        color,
        weightG: p.weightG,
        demo: demo || isDemoId(p.id),
      },
      qty,
    );
  }

  const acc = "border-t border-neutral-200 py-3";
  const accSummary = "cursor-pointer list-none text-sm font-semibold uppercase tracking-wide";

  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      {/* Gallery */}
      <div className="flex flex-col-reverse gap-3 md:flex-row">
        {n > 1 && (
          <div className="flex gap-2 overflow-x-auto md:max-h-[640px] md:flex-col md:overflow-y-auto">
            {p.images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => go(i)}
                aria-label={`${p.name} ${i + 1}`}
                aria-current={i === active}
                className={`relative h-20 w-16 shrink-0 overflow-hidden rounded border ${i === active ? "border-neutral-900" : "border-neutral-200"}`}
              >
                <Image src={src} alt="" fill sizes="64px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => n > 0 && setLightbox(true)}
            className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-lg bg-neutral-100"
            aria-label="Zoom"
          >
            {n > 0 && <Image src={p.images[active]} alt={p.name} fill priority sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />}
            {pct > 0 && <span className="absolute left-3 top-3 rounded bg-rose-700 px-2 py-1 text-xs font-semibold text-white">-{pct}%</span>}
          </button>
          {n > 1 && (
            <>
              <button type="button" onClick={() => go(active - 1)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow">‹</button>
              <button type="button" onClick={() => go(active + 1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 shadow">›</button>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="md:sticky md:top-28 md:self-start">
        <Link href={href(lang, `/brands/${p.brandSlug}`, demo)} className="text-xs uppercase tracking-wide text-neutral-500 hover:underline">
          {p.brandName}
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{p.name}</h1>
        <p className="mt-2 flex items-baseline gap-3">
          <span className={`text-xl ${pct > 0 ? "font-semibold text-rose-700" : ""}`}>{pkr(p.sellPrice)}</span>
          {pct > 0 && <span className="text-neutral-400 line-through">{pkr(p.comparePrice!)}</span>}
          {pct > 0 && <span className="text-sm font-medium text-rose-700">{pct}% {d.off}</span>}
        </p>

        {p.kind === "unstitched" && <p className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-900">{d.unstitchedNote}</p>}

        {p.colors.length > 0 && (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium">
              {d.selectColor}: <span className="font-normal text-neutral-600">{color}</span>
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  aria-label={c.name}
                  aria-pressed={color === c.name}
                  onClick={() => pickColor(c.name)}
                  className={`h-8 w-8 rounded-full border-2 ${color === c.name ? "border-neutral-900 ring-2 ring-white ring-inset" : "border-neutral-300"}`}
                  style={{ background: c.hex ?? "#d4d4d4" }}
                />
              ))}
            </div>
          </fieldset>
        )}

        {needsSize && (
          <fieldset className="mt-5">
            <legend className="text-sm font-medium">{d.selectSize}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.sizes.map((s) => {
                const out = !availableSizes(p).includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={out}
                    title={out ? d.soldOutSize : undefined}
                    aria-pressed={size === s}
                    onClick={() => {
                      setSize(s);
                      setError("");
                    }}
                    className={[
                      "min-w-12 rounded border px-3 py-2 text-sm",
                      out ? "cursor-not-allowed border-neutral-200 text-neutral-300 line-through" : "hover:border-neutral-900",
                      size === s ? "border-neutral-900 bg-neutral-900 text-white hover:border-neutral-900" : out ? "" : "border-neutral-300",
                    ].join(" ")}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <div className="mt-5 flex items-center gap-4">
          <div className="flex items-center rounded border border-neutral-300" role="group" aria-label={d.qty}>
            <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="−">−</button>
            <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
            <button type="button" className="px-3 py-2" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} aria-label="+">+</button>
          </div>
          <button
            type="button"
            disabled={!purchasable}
            onClick={addToCart}
            className="flex-1 rounded bg-neutral-900 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {purchasable ? d.addToCart : d.soldOut}
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
        {p.modelInfo && <p className="mt-4 text-xs text-neutral-500">{p.modelInfo}</p>}

        <div className="mt-6">
          <details open className={acc}>
            <summary className={accSummary}>{d.description}</summary>
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{p.description}</p>
          </details>
          {(p.details || p.fabric) && (
            <details className={acc}>
              <summary className={accSummary}>{d.detailsComposition}</summary>
              <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{[p.fabric && `Fabric: ${p.fabric}`, p.details].filter(Boolean).join("\n")}</p>
            </details>
          )}
          <details className={`${acc} border-b`}>
            <summary className={accSummary}>{d.deliveriesReturns}</summary>
            <p className="mt-2 text-sm text-neutral-700">{d.deliveryInfo}</p>
            <p className="mt-2 text-sm text-neutral-700">{d.returnInfo}</p>
          </details>
        </div>
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" role="dialog" aria-modal="true" onClick={() => setLightbox(false)}>
          <button type="button" className="absolute right-4 top-4 text-3xl text-white" aria-label={d.close} onClick={() => setLightbox(false)}>×</button>
          {n > 1 && <button type="button" className="absolute left-4 text-4xl text-white" aria-label="Previous image" onClick={(e) => { e.stopPropagation(); go(active - 1); }}>‹</button>}
          <div className="relative h-[90vh] w-[min(90vw,68vh)]" onClick={(e) => e.stopPropagation()}>
            <Image src={p.images[active]} alt={p.name} fill sizes="90vw" className="object-contain" />
          </div>
          {n > 1 && <button type="button" className="absolute right-4 text-4xl text-white" aria-label="Next image" onClick={(e) => { e.stopPropagation(); go(active + 1); }}>›</button>}
        </div>
      )}
    </div>
  );
}
