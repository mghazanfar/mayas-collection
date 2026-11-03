import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getBrand, getProducts } from "@/lib/catalog";
import { t, type Lang } from "@/lib/i18n";

export default async function BrandView({ lang, slug, demo }: { lang: Lang; slug: string; demo: boolean }) {
  const brand = await getBrand(slug, demo);
  if (!brand) notFound();
  const products = await getProducts({ brandId: brand.id, demo });

  return (
    <>
      <h1 className="text-2xl font-bold">{brand.name}</h1>
      {brand.description && <p className="mt-2 max-w-2xl text-neutral-600">{brand.description}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.length === 0 && <p className="text-neutral-500">{t[lang].noProducts}</p>}
        {products.map((p) => (
          <ProductCard key={p.id} product={p} lang={lang} demo={demo} />
        ))}
      </div>
    </>
  );
}
