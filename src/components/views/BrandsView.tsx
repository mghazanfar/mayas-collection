import Link from "next/link";
import { getBrands } from "@/lib/catalog";
import { href, t, type Lang } from "@/lib/i18n";

export default async function BrandsView({ lang, demo }: { lang: Lang; demo: boolean }) {
  const brands = await getBrands(demo);
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{t[lang].brands}</h1>
      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {brands.map((b) => (
          <li key={b.id}>
            <Link
              href={href(lang, `/brands/${b.slug}`, demo)}
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
