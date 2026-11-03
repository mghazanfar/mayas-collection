import Breadcrumbs from "@/components/Breadcrumbs";
import ProductBrowser from "@/components/ProductBrowser";
import SearchBrowser from "@/components/SearchBrowser";
import { getProducts } from "@/lib/catalog";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";

// One view for "all products" and the search page (search just reads ?q= in the browser).
export default async function ShopView({ lang, demo, search = false }: { lang: Lang; demo: boolean; search?: boolean }) {
  const products = await getProducts({ demo });
  const d = ts[lang];
  const title = search ? d.searchResults : d.allProducts;
  return (
    <>
      <Breadcrumbs items={[{ label: d.home, to: href(lang, "/", demo) }, { label: title }]} />
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      {search ? (
        <SearchBrowser products={products} lang={lang} demo={demo} />
      ) : (
        <ProductBrowser products={products} lang={lang} demo={demo} showBrandFilter />
      )}
    </>
  );
}
