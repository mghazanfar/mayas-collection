import Image from "next/image";
import Link from "next/link";
import { href, t, type Lang } from "@/lib/i18n";
import { pkr } from "@/lib/site";
import type { Product } from "@/lib/catalog";

export default function ProductCard({ product, lang }: { product: Product; lang: Lang }) {
  const img = product.images[0];
  return (
    <Link href={href(lang, `/products/${product.slug}`)} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-rose-100 to-amber-50">
        {img && (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition group-hover:scale-105"
          />
        )}
        {!product.inStock && (
          <span className="absolute left-2 top-2 rounded bg-neutral-900 px-2 py-0.5 text-xs text-white">
            {t[lang].outOfStock}
          </span>
        )}
      </div>
      <h3 className="mt-2 text-sm font-medium">{product.name}</h3>
      <p className="text-sm text-neutral-600">{pkr(product.sellPrice)}</p>
    </Link>
  );
}
