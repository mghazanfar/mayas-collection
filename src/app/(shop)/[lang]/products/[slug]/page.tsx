import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductView from "@/components/views/ProductView";
import { getProduct, getProducts } from "@/lib/catalog";
import { LANGS, isLang } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 300;

type Props = { params: Promise<{ lang: string; slug: string }> };

// Pre-render known products; new ones are rendered on first request (ISR).
export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return LANGS.flatMap((lang) => products.map((p) => ({ lang, slug: p.slug })));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const p = await getProduct(slug);
  if (!isLang(lang) || !p) return {};
  return {
    title: p.name,
    description: p.description.slice(0, 155) || `Buy ${p.name} online. Worldwide delivery.`,
    alternates: alternatesFor(lang, `/products/${slug}`),
    openGraph: { images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  return <ProductView lang={lang} slug={slug} demo={false} />;
}
