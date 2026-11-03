import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandView from "@/components/views/BrandView";
import { getBrand, getBrands } from "@/lib/catalog";
import { LANGS, isLang } from "@/lib/i18n";
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
  return <BrandView lang={lang} slug={slug} demo={false} />;
}
