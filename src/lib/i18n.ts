export const LANGS = ["en", "roman", "ur"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(v: string): v is Lang {
  return (LANGS as readonly string[]).includes(v);
}

// English lives at the root (no prefix); the others get /roman and /ur.
export function href(lang: Lang, path: string): string {
  const p = path === "/" ? "" : path;
  return lang === "en" ? p || "/" : `/${lang}${p}`;
}

export const HTML_LANG: Record<Lang, string> = { en: "en", roman: "ur-Latn", ur: "ur" };
export const DIR: Record<Lang, "ltr" | "rtl"> = { en: "ltr", roman: "ltr", ur: "rtl" };

type Dict = {
  brands: string;
  newArrivals: string;
  cart: string;
  returns: string;
  heroTitle: string;
  heroSub: string;
  shopNow: string;
  shopByBrand: string;
  viewAll: string;
  addToCart: string;
  size: string;
  color: string;
  unstitched: string;
  outOfStock: string;
  langHint: string;
  noProducts: string;
};

export const t: Record<Lang, Dict> = {
  en: {
    brands: "Brands",
    newArrivals: "New Arrivals",
    cart: "Cart",
    returns: "Returns",
    heroTitle: "Authentic Pakistani Dresses, Delivered Worldwide",
    heroSub: "Lawn, chiffon, bridal and unstitched collections from Pakistan's best brands.",
    shopNow: "Shop now",
    shopByBrand: "Shop by brand",
    viewAll: "View all",
    addToCart: "Add to cart",
    size: "Size",
    color: "Colour",
    unstitched: "Unstitched",
    outOfStock: "Out of stock",
    langHint: "Read in Roman Urdu",
    noProducts: "No products yet.",
  },
  roman: {
    brands: "Brands",
    newArrivals: "Nayi Collection",
    cart: "Cart",
    returns: "Wapsi",
    heroTitle: "Asli Pakistani Dresses, Poori Duniya Mein Delivery",
    heroSub: "Pakistan ke behtareen brands ki lawn, chiffon, bridal aur unstitched collection.",
    shopNow: "Abhi kharidein",
    shopByBrand: "Brand ke hisaab se dekhein",
    viewAll: "Sab dekhein",
    addToCart: "Cart mein daalein",
    size: "Size",
    color: "Rang",
    unstitched: "Unstitched (bina silai)",
    outOfStock: "Stock mein nahi",
    langHint: "Roman Urdu mein parhein",
    noProducts: "Abhi koi product nahi.",
  },
  ur: {
    brands: "برانڈز",
    newArrivals: "نیا کلیکشن",
    cart: "کارٹ",
    returns: "واپسی",
    heroTitle: "اصلی پاکستانی ملبوسات، دنیا بھر میں ڈیلیوری",
    heroSub: "پاکستان کے بہترین برانڈز کی لان، شفون، برائیڈل اور ان سلے کلیکشن۔",
    shopNow: "ابھی خریدیں",
    shopByBrand: "برانڈ کے لحاظ سے دیکھیں",
    viewAll: "سب دیکھیں",
    addToCart: "کارٹ میں ڈالیں",
    size: "سائز",
    color: "رنگ",
    unstitched: "ان سلا",
    outOfStock: "اسٹاک میں نہیں",
    langHint: "اردو میں پڑھیں",
    noProducts: "ابھی کوئی پروڈکٹ نہیں۔",
  },
};
