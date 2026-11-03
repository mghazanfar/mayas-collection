import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ProductDetail from "@/components/ProductDetail";
import { getProduct, getProducts } from "@/lib/catalog";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { isPurchasable } from "@/lib/product-types";
import { SITE_URL } from "@/lib/site";

export default async function ProductView({ lang, slug, demo }: { lang: Lang; slug: string; demo: boolean }) {
  const p = await getProduct(slug, demo);
  if (!p) notFound();
  const d = ts[lang];
  const related = (await getProducts({ brandId: p.brandId, demo })).filter((x) => x.id !== p.id).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images,
    brand: { "@type": "Brand", name: p.brandName },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${href("en", `/products/${p.slug}`)}`,
      priceCurrency: "PKR",
      price: p.sellPrice,
      availability: isPurchasable(p) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      {!demo && (
        <script
          type="application/ld+json"
          // "<" is escaped so admin-entered text can't close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <Breadcrumbs
        items={[
          { label: d.home, to: href(lang, "/", demo) },
          { label: p.brandName, to: href(lang, `/brands/${p.brandSlug}`, demo) },
          { label: p.name },
        ]}
      />
      <ProductDetail product={p} lang={lang} demo={demo} />
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-semibold">{d.youMayAlsoLike}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} product={r} lang={lang} demo={demo} />)}
          </div>
        </section>
      )}
    </>
  );
}
