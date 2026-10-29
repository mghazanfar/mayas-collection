import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import { LANGS, isLang, t } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";
import { SITE_URL, pkr } from "@/lib/site";

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
  const p = await getProduct(slug);
  if (!p) notFound();
  const d = t[lang];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${p.slug}`,
      priceCurrency: "PKR",
      price: p.sellPrice,
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <script
        type="application/ld+json"
        // JSON.stringify can't contain "</script>" from admin-entered text once "<" is escaped.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="grid gap-3">
        {p.images.length === 0 && <div className="aspect-[3/4] rounded-lg bg-gradient-to-br from-rose-100 to-amber-50" />}
        {p.images.map((src, i) => (
          <div key={src} className="relative aspect-[3/4] overflow-hidden rounded-lg">
            <Image src={src} alt={`${p.name} ${i + 1}`} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" priority={i === 0} />
          </div>
        ))}
      </div>
      <div>
        <h1 className="text-2xl font-bold">{p.name}</h1>
        <p className="mt-2 text-xl text-rose-700">{pkr(p.sellPrice)}</p>
        {p.kind === "unstitched" && <p className="mt-2 text-sm text-neutral-600">{d.unstitched}</p>}
        {p.sizes.length > 0 && (
          <p className="mt-4 text-sm">
            <strong>{d.size}:</strong> {p.sizes.join(", ")}
          </p>
        )}
        {p.colors.length > 0 && (
          <p className="mt-2 text-sm">
            <strong>{d.color}:</strong> {p.colors.join(", ")}
          </p>
        )}
        <p className="mt-6 whitespace-pre-line text-neutral-700">{p.description}</p>
        {/* Cart button comes with the cart milestone. */}
        <p className="mt-6 text-sm text-neutral-500">{p.inStock ? "" : d.outOfStock}</p>
      </div>
    </div>
  );
}
