import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import { getBrand, getProducts } from "@/lib/catalog";
import { href, t, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";

export default async function BrandView({ lang, slug, demo }: { lang: Lang; slug: string; demo: boolean }) {
  const brand = await getBrand(slug, demo);
  if (!brand) notFound();
  const products = await getProducts({ brandId: brand.id, demo });

  return (
    <>
      <Breadcrumbs items={[{ label: ts[lang].home, to: href(lang, "/", demo) }, { label: t[lang].brands, to: href(lang, "/brands", demo) }, { label: brand.name }]} />
      <h1 className="text-2xl font-bold">{brand.name}</h1>
      {brand.description && <p className="mt-2 max-w-2xl text-neutral-600">{brand.description}</p>}
      {!brand.inStock && <p className="mt-3 inline-block rounded bg-neutral-900 px-3 py-1 text-sm text-white">{t[lang].outOfStock}</p>}
      <div className="mt-6">
        {products.length === 0 ? <p className="text-neutral-500">{t[lang].noProducts}</p> : <ProductBrowser products={products} lang={lang} demo={demo} />}
      </div>
    </>
  );
}
