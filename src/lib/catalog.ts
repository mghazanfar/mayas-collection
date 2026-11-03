import "server-only";
import { getDb } from "./supabase";
import { parseColor, type Brand, type Product } from "./product-types";

export type { Brand, Product } from "./product-types";

// buy_price is deliberately NOT selected: public pages must never see our cost.
const PRODUCT_COLS =
  "id, slug, brand_id, name, description, details, fabric, model_info, images, sell_price, compare_price, weight_g, kind, sizes, sold_out_sizes, colors, color_images, in_stock, created_at, brands(name, slug)";
const BRAND_COLS = "id, slug, name, description, logo_url, in_stock";

/* eslint-disable @typescript-eslint/no-explicit-any */
const toBrand = (r: any): Brand => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description,
  logoUrl: r.logo_url,
  inStock: r.in_stock,
});

const toProduct = (r: any): Product => ({
  id: r.id,
  slug: r.slug,
  brandId: r.brand_id,
  brandName: r.brands?.name ?? "",
  brandSlug: r.brands?.slug ?? "",
  name: r.name,
  description: r.description,
  details: r.details ?? "",
  fabric: r.fabric ?? "",
  modelInfo: r.model_info ?? "",
  images: r.images ?? [],
  sellPrice: r.sell_price,
  comparePrice: r.compare_price ?? null,
  weightG: r.weight_g,
  kind: r.kind,
  sizes: r.sizes ?? [],
  soldOutSizes: r.sold_out_sizes ?? [],
  colors: (r.colors ?? []).map(parseColor),
  colorImages: r.color_images ?? {},
  inStock: r.in_stock,
  createdAt: r.created_at,
});

// ---- Demo catalog: reachable only via /demo (noindex), never mixed into live data. ----
const DEMO_BRANDS: Brand[] = [
  { id: "d-b1", slug: "demo-lawn-house", name: "Demo Lawn House", description: "Sample brand for testing. Not a real product.", logoUrl: null, inStock: true },
  { id: "d-b2", slug: "demo-bridal-studio", name: "Demo Bridal Studio", description: "Sample bridal brand for testing.", logoUrl: null, inStock: true },
  { id: "d-b3", slug: "demo-sold-out", name: "Demo Sold Out Brand", description: "Shows how an out-of-stock brand looks.", logoUrl: null, inStock: false },
];

const img = (name: string, n = 4) => Array.from({ length: n }, (_, i) => `/demo/${name}-${i + 1}.svg`);
const brandOf = (id: string) => DEMO_BRANDS.find((b) => b.id === id)!;
const demo = (
  id: string,
  brandId: string,
  slug: string,
  name: string,
  rest: Partial<Product> & Pick<Product, "sellPrice" | "kind" | "images">,
): Product => ({
  id: `d-${id}`,
  slug,
  brandId,
  brandName: brandOf(brandId).name,
  brandSlug: brandOf(brandId).slug,
  name,
  description: "Sample product for testing the shop. Nothing here is real.",
  details: "Fabric: sample lawn\nCare: dry clean recommended\nIncludes: shirt, dupatta, trouser",
  fabric: "",
  modelInfo: "",
  comparePrice: null,
  weightG: 1000,
  sizes: [],
  soldOutSizes: [],
  colors: [],
  colorImages: {},
  inStock: true,
  createdAt: new Date(2026, 0, 1).toISOString(),
  ...rest,
});

const DEMO_PRODUCTS: Product[] = [
  demo("1", "d-b1", "demo-lawn-3pc", "Embroidered Lawn 3-Piece", {
    sellPrice: 7650, comparePrice: 8500, kind: "stitched", fabric: "Premium lawn",
    images: [...img("lawn-mint", 3), "/demo/lawn-peach-1.svg", "/demo/lawn-peach-3.svg"],
    sizes: ["S", "M", "L", "XL"], soldOutSizes: ["XL"],
    colors: [{ name: "Mint", hex: "#8fd3b6" }, { name: "Peach", hex: "#f6b49a" }],
    colorImages: { Mint: 0, Peach: 3 }, modelInfo: "Model is wearing size M. Height 5'7\".",
  }),
  demo("2", "d-b1", "demo-unstitched-chiffon", "Unstitched Chiffon Suit", {
    sellPrice: 11000, kind: "unstitched", weightG: 900, fabric: "Chiffon",
    images: [...img("chiffon-rose", 2), "/demo/chiffon-rose-4.svg"],
    description: "Unstitched 3-piece. No size or colour options: you get the full fabric set for your tailor.",
  }),
  demo("3", "d-b2", "demo-bridal-lehenga", "Bridal Lehenga", {
    sellPrice: 65000, kind: "stitched", weightG: 2500, sizes: ["M", "L", "XL"], images: img("bridal-maroon"),
    colors: [{ name: "Maroon", hex: "#8c1f3a" }],
  }),
  demo("4", "d-b1", "demo-sold-out-kurta", "Cotton Kurta (sold out)", {
    sellPrice: 4200, kind: "stitched", weightG: 600, sizes: ["S", "M"], inStock: false, images: img("kurta-white", 3),
    colors: [{ name: "White", hex: "#f4f1ea" }],
  }),
  demo("5", "d-b2", "demo-khaddar-suit", "Winter Khaddar 2-Piece", {
    sellPrice: 5250, comparePrice: 7500, kind: "stitched", weightG: 1100, sizes: ["S", "M", "L"], soldOutSizes: ["S"],
    images: img("khaddar-teal"), colors: [{ name: "Teal", hex: "#3f8f94" }],
  }),
  demo("6", "d-b1", "demo-organza-set", "Organza Party Wear", {
    sellPrice: 15900, kind: "stitched", weightG: 1200, sizes: ["XS", "S", "M", "L"],
    images: img("organza-lilac"), colors: [{ name: "Lilac", hex: "#b9a3dd" }],
  }),
  demo("7", "d-b2", "demo-silk-unstitched", "Raw Silk Unstitched Suit", {
    sellPrice: 13500, kind: "unstitched", weightG: 950, images: img("silk-gold", 3),
  }),
  demo("8", "d-b1", "demo-printed-lawn", "Printed Lawn 2-Piece", {
    sellPrice: 4900, comparePrice: 6500, kind: "stitched", weightG: 800, sizes: ["S", "M", "L"],
    images: img("lawn-peach"), colors: [{ name: "Peach", hex: "#f6b49a" }],
  }),
];

export async function getBrands(demo = false): Promise<Brand[]> {
  if (demo) return DEMO_BRANDS;
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db.from("brands").select(BRAND_COLS).eq("active", true).order("sort").order("name");
  if (error) throw error;
  return (data ?? []).map(toBrand);
}

export async function getBrand(slug: string, demo = false): Promise<Brand | null> {
  if (demo) return DEMO_BRANDS.find((b) => b.slug === slug) ?? null;
  const db = getDb();
  if (!db) return null;
  const { data, error } = await db.from("brands").select(BRAND_COLS).eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw error;
  return data ? toBrand(data) : null;
}

// Returns every active product (newest first). The shop is small, so filtering and
// sorting happen in the browser on this list, which also keeps pages statically cached.
export async function getProducts(opts: { brandId?: string; limit?: number; demo?: boolean } = {}): Promise<Product[]> {
  if (opts.demo) {
    const list = opts.brandId ? DEMO_PRODUCTS.filter((p) => p.brandId === opts.brandId) : DEMO_PRODUCTS;
    return list.slice(0, opts.limit ?? list.length);
  }
  const db = getDb();
  if (!db) return [];
  let q = db.from("products").select(PRODUCT_COLS).eq("active", true).order("created_at", { ascending: false });
  if (opts.brandId) q = q.eq("brand_id", opts.brandId);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(toProduct);
}

export async function getProduct(slug: string, demo = false): Promise<Product | null> {
  if (demo) return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  const db = getDb();
  if (!db) return null;
  const { data, error } = await db.from("products").select(PRODUCT_COLS).eq("slug", slug).eq("active", true).maybeSingle();
  if (error) throw error;
  return data ? toProduct(data) : null;
}

// True while the live shop has no brand or no product yet: drives the "View demo" bar.
// On a DB error we return false so a hiccup never shows visitors a demo prompt.
export async function isLiveCatalogEmpty(): Promise<boolean> {
  const db = getDb();
  if (!db) return true;
  try {
    const [b, p] = await Promise.all([
      db.from("brands").select("id", { count: "exact", head: true }).eq("active", true),
      db.from("products").select("id", { count: "exact", head: true }).eq("active", true),
    ]);
    if (b.error || p.error) return false;
    return (b.count ?? 0) === 0 || (p.count ?? 0) === 0;
  } catch {
    return false;
  }
}

// For the admin "Import sample catalog" button.
export const getDemoCatalog = () => ({ brands: DEMO_BRANDS, products: DEMO_PRODUCTS });
