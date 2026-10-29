import type { MetadataRoute } from "next";
import { getBrands, getProducts } from "@/lib/catalog";
import { LANGS, href } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, products] = await Promise.all([getBrands(), getProducts()]);
  const paths = [
    "/",
    "/brands",
    ...brands.map((b) => `/brands/${b.slug}`),
    ...products.map((p) => `/products/${p.slug}`),
  ];

  // One entry per language; each lists all alternates so Google pairs them.
  return paths.flatMap((path) =>
    LANGS.map((lang) => ({
      url: `${SITE_URL}${href(lang, path)}`,
      lastModified: new Date(),
      alternates: {
        languages: {
          en: `${SITE_URL}${href("en", path)}`,
          "ur-Latn": `${SITE_URL}${href("roman", path)}`,
          ur: `${SITE_URL}${href("ur", path)}`,
        },
      },
    })),
  );
}
