import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrands } from "@/lib/catalog";
import { href, isLang, t } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: "Pakistani Dress Brands",
    description: "Shop new collections from top Pakistani clothing brands.",
    alternates: alternatesFor(lang, "/brands"),
  };
}

export default async function Brands({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const brands = await getBrands();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t[lang].brands}</h1>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {brands.map((b) => (
          <li key={b.id}>
            <Link
              href={href(lang, `/brands/${b.slug}`)}
              className="block rounded-lg border border-neutral-200 p-6 text-center font-medium hover:bg-neutral-50"
            >
              {b.name}
              {!b.inStock && <span className="mt-1 block text-xs text-neutral-500">{t[lang].outOfStock}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
