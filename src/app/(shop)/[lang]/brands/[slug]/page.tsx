import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { getBrand, getBrands, getProducts } from "@/lib/catalog";
import { LANGS, isLang, t } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; slug: string }> };

// Pre-render known brands; new ones are rendered on first request (ISR).
export async function generateStaticParams() {
  try {
    const brands = await getBrands();
    return LANGS.flatMap((lang) => brands.map((b) => ({ lang, slug: b.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const brand = await getBrand(slug);
  if (!isLang(lang) || !brand) return {};
  return {
    title: `${brand.name} Dresses Online`,
    description: brand.description || `Shop the latest ${brand.name} collection, delivered worldwide.`,
    alternates: alternatesFor(lang, `/brands/${slug}`),
  };
}

export default async function BrandPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const brand = await getBrand(slug);
  if (!brand) notFound();
  const products = await getProducts({ brandId: brand.id });

  return (
    <>
      <h1 className="text-2xl font-bold">{brand.name}</h1>
      {brand.description && <p className="mt-2 max-w-2xl text-neutral-600">{brand.description}</p>}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.length === 0 && <p className="text-neutral-500">{t[lang].noProducts}</p>}
        {products.map((p) => (
          <ProductCard key={p.id} product={p} lang={lang} />
        ))}
      </div>
    </>
  );
}
