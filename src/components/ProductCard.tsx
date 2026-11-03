import Image from "next/image";
import Link from "next/link";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { discountPct, isPurchasable, type Product } from "@/lib/product-types";
import { pkr } from "@/lib/site";

export default function ProductCard({ product, lang, demo = false }: { product: Product; lang: Lang; demo?: boolean }) {
  const d = ts[lang];
  const [first, second] = product.images;
  const pct = discountPct(product);
  const soldOut = !isPurchasable(product);

  return (
    <Link href={href(lang, `/products/${product.slug}`, demo)} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-100">
        {first && (
          <Image
            src={first}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        {second && (
          <Image
            src={second}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {pct > 0 && !soldOut && <span className="rounded bg-rose-700 px-2 py-0.5 text-xs font-semibold text-white">-{pct}%</span>}
          {soldOut && <span className="rounded bg-neutral-900 px-2 py-0.5 text-xs text-white">{d.soldOut}</span>}
        </div>
      </div>
      <p className="mt-2 text-xs uppercase tracking-wide text-neutral-500">{product.brandName}</p>
      <h3 className="text-sm font-medium leading-snug">{product.name}</h3>
      <p className="mt-0.5 flex items-baseline gap-2 text-sm">
        <span className={pct > 0 ? "font-semibold text-rose-700" : "text-neutral-700"}>{pkr(product.sellPrice)}</span>
        {pct > 0 && <span className="text-xs text-neutral-400 line-through">{pkr(product.comparePrice!)}</span>}
      </p>
      {product.colors.length > 0 && (
        <p className="mt-1.5 flex gap-1.5" aria-label={product.colors.map((c) => c.name).join(", ")}>
          {product.colors.slice(0, 6).map((c) => (
            <span
              key={c.name}
              title={c.name}
              className="h-3.5 w-3.5 rounded-full border border-neutral-300"
              style={{ background: c.hex ?? "#d4d4d4" }}
            />
          ))}
        </p>
      )}
    </Link>
  );
}
