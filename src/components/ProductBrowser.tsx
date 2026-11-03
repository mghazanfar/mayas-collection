"use client";

import { useMemo, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { discountPct, isPurchasable, type Product } from "@/lib/product-types";
import ProductCard from "./ProductCard";

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL"];
type Sort = "new" | "low" | "high" | "disc";

export default function ProductBrowser({
  products,
  lang,
  demo,
  query = "",
  showBrandFilter = false,
}: {
  products: Product[];
  lang: Lang;
  demo: boolean;
  query?: string;
  showBrandFilter?: boolean;
}) {
  const d = ts[lang];
  const q = query.trim().toLowerCase();
  const [sort, setSort] = useState<Sort>("new");
  const [sizes, setSizes] = useState<string[]>([]);
  const [kind, setKind] = useState<string>("");
  const [brand, setBrand] = useState<string>("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [open, setOpen] = useState(false);

  const allSizes = useMemo(
    () => [...new Set(products.flatMap((p) => p.sizes))].sort((a, b) => (SIZE_ORDER.indexOf(a) + 99) % 99 - (SIZE_ORDER.indexOf(b) + 99) % 99),
    [products],
  );
  const brands = useMemo(() => [...new Map(products.map((p) => [p.brandSlug, p.brandName])).entries()], [products]);

  const shown = useMemo(() => {
    const lo = min ? Number(min) : 0;
    const hi = max ? Number(max) : Infinity;
    const list = products.filter((p) => {
      if (q && !`${p.name} ${p.brandName} ${p.fabric} ${p.kind} ${p.colors.map((c) => c.name).join(" ")}`.toLowerCase().includes(q)) return false;
      if (sizes.length && !sizes.some((s) => p.sizes.includes(s) && !p.soldOutSizes.includes(s))) return false;
      if (kind && p.kind !== kind) return false;
      if (brand && p.brandSlug !== brand) return false;
      if (p.sellPrice < lo || p.sellPrice > hi) return false;
      if (inStock && !isPurchasable(p)) return false;
      if (onSale && discountPct(p) === 0) return false;
      return true;
    });
    const by: Record<Sort, (a: Product, b: Product) => number> = {
      new: (a, b) => b.createdAt.localeCompare(a.createdAt),
      low: (a, b) => a.sellPrice - b.sellPrice,
      high: (a, b) => b.sellPrice - a.sellPrice,
      disc: (a, b) => discountPct(b) - discountPct(a),
    };
    return [...list].sort(by[sort]);
  }, [products, q, sizes, kind, brand, min, max, inStock, onSale, sort]);

  const active = sizes.length + (kind ? 1 : 0) + (brand ? 1 : 0) + (min ? 1 : 0) + (max ? 1 : 0) + (inStock ? 1 : 0) + (onSale ? 1 : 0);
  const clear = () => { setSizes([]); setKind(""); setBrand(""); setMin(""); setMax(""); setInStock(false); setOnSale(false); };
  const chip = (on: boolean) => `rounded border px-3 py-1.5 text-sm ${on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`;
  const field = "w-24 rounded border border-neutral-300 px-2 py-1.5 text-sm";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-600" aria-live="polite">
          {q && <span className="me-2 font-medium">“{q}”</span>}
          {shown.length} {d.products}
        </p>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="rounded border border-neutral-300 px-3 py-1.5 text-sm">
            {d.filters}{active > 0 ? ` (${active})` : ""}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="sr-only">{d.sortBy}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded border border-neutral-300 px-2 py-1.5 text-sm">
              <option value="new">{d.sortNewest}</option>
              <option value="low">{d.sortPriceLow}</option>
              <option value="high">{d.sortPriceHigh}</option>
              <option value="disc">{d.sortDiscount}</option>
            </select>
          </label>
        </div>
      </div>

      {open && (
        <div className="mb-6 grid gap-5 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {allSizes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">{d.sizes}</p>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((s) => (
                  <button key={s} type="button" aria-pressed={sizes.includes(s)} className={chip(sizes.includes(s))} onClick={() => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))}>{s}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-sm font-semibold">{d.type}</p>
            <div className="flex flex-wrap gap-2">
              {(["stitched", "unstitched"] as const).map((k) => (
                <button key={k} type="button" aria-pressed={kind === k} className={chip(kind === k)} onClick={() => setKind(kind === k ? "" : k)}>{d[k]}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{d.priceRange}</p>
            <div className="flex items-center gap-2">
              <input aria-label={d.min} inputMode="numeric" placeholder={d.min} value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))} className={field} />
              <span>–</span>
              <input aria-label={d.max} inputMode="numeric" placeholder={d.max} value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))} className={field} />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} /> {d.inStockOnly}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={onSale} onChange={(e) => setOnSale(e.target.checked)} /> {d.onSaleOnly}</label>
          </div>
          {showBrandFilter && brands.length > 1 && (
            <div>
              <p className="mb-2 text-sm font-semibold">{d.brand}</p>
              <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded border border-neutral-300 px-2 py-1.5 text-sm">
                <option value="">–</option>
                {brands.map(([slug, name]) => <option key={slug} value={slug}>{name}</option>)}
              </select>
            </div>
          )}
          {active > 0 && <button type="button" onClick={clear} className="self-end text-start text-sm underline">{d.clearFilters}</button>}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">{d.noResults}</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => <ProductCard key={p.id} product={p} lang={lang} demo={demo} />)}
        </div>
      )}
    </div>
  );
}
