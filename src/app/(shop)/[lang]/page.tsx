import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getBrands, getProducts } from "@/lib/catalog";
import { href, isLang, t } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import { notFound } from "next/navigation";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { alternates: alternatesFor(lang, "/") };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = t[lang];
  const [brands, products] = await Promise.all([getBrands(), getProducts({ limit: 8 })]);

  return (
    <>
      <section className="rounded-2xl bg-gradient-to-br from-rose-100 via-amber-50 to-rose-50 px-6 py-16 text-center">
        <h1 className="mx-auto max-w-3xl text-3xl font-bold sm:text-5xl">{d.heroTitle}</h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-700">{d.heroSub}</p>
        <Link
          href={href(lang, "/brands")}
          className="mt-8 inline-block rounded-full bg-rose-700 px-6 py-3 font-semibold text-white hover:bg-rose-800"
        >
          {d.shopNow}
        </Link>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">{d.shopByBrand}</h2>
        <ul className="flex flex-wrap gap-3">
          {brands.map((b) => (
            <li key={b.id}>
              <Link
                href={href(lang, `/brands/${b.slug}`)}
                className="block rounded-full border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100"
              >
                {b.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-xl font-semibold">{d.newArrivals}</h2>
        {products.length === 0 ? (
          <p className="text-neutral-500">{d.noProducts}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} lang={lang} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
