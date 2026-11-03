import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getBrands, getProducts } from "@/lib/catalog";
import { href, t, type Lang } from "@/lib/i18n";
import { discountPct } from "@/lib/product-types";

export default async function HomeView({ lang, demo }: { lang: Lang; demo: boolean }) {
  const d = t[lang];
  const [brands, products] = await Promise.all([getBrands(demo), getProducts({ demo })]);
  const newest = products.slice(0, 8);
  const sale = products.filter((p) => discountPct(p) > 0).slice(0, 4);
  const heroImgs = products.flatMap((p) => p.images.slice(0, 1)).slice(0, 3);

  return (
    <>
      <section className="grid items-center gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 via-amber-50 to-rose-50 md:grid-cols-[1.1fr_1fr]">
        <div className="px-6 py-12 md:px-12">
          <h1 className="text-3xl font-bold sm:text-5xl">{d.heroTitle}</h1>
          <p className="mt-4 max-w-xl text-neutral-700">{d.heroSub}</p>
          <Link href={href(lang, "/shop", demo)} className="mt-8 inline-block rounded-full bg-rose-700 px-6 py-3 font-semibold text-white hover:bg-rose-800">{d.shopNow}</Link>
        </div>
        {heroImgs.length > 0 && (
          <div className="hidden grid-cols-3 gap-2 p-4 md:grid">
            {heroImgs.map((src, i) => (
              <div key={src} className={`relative aspect-[3/4] overflow-hidden rounded-lg ${i === 1 ? "mt-6" : ""}`}>
                <Image src={src} alt="" fill sizes="20vw" className="object-cover" priority={i === 0} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">{d.shopByBrand}</h2>
        <ul className="flex flex-wrap gap-3">
          {brands.map((b) => (
            <li key={b.id}>
              <Link href={href(lang, `/brands/${b.slug}`, demo)} className="block rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100">
                {b.name}{!b.inStock && <span className="ms-2 text-xs text-neutral-400">{d.outOfStock}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">{d.newArrivals}</h2>
          <Link href={href(lang, "/shop", demo)} className="text-sm underline">{d.viewAll}</Link>
        </div>
        {newest.length === 0 ? <p className="text-neutral-500">{d.noProducts}</p> : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {newest.map((p) => <ProductCard key={p.id} product={p} lang={lang} demo={demo} />)}
          </div>
        )}
      </section>

      {sale.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-semibold text-rose-700">Sale</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {sale.map((p) => <ProductCard key={p.id} product={p} lang={lang} demo={demo} />)}
          </div>
        </section>
      )}
    </>
  );
}
