import "server-only";
import { getDb } from "./supabase";

export type Brand = {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  inStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  brandId: string;
  name: string;
  description: string;
  images: string[];
  sellPrice: number;
  weightG: number;
  kind: "stitched" | "unstitched" | "other";
  sizes: string[];
  colors: string[];
  inStock: boolean;
};

// buy_price is deliberately NOT in this list: public pages must never see our cost.
const PRODUCT_COLS =
  "id, slug, brand_id, name, description, images, sell_price, weight_g, kind, sizes, colors, in_stock";
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
  name: r.name,
  description: r.description,
  images: r.images ?? [],
  sellPrice: r.sell_price,
  weightG: r.weight_g,
  kind: r.kind,
  sizes: r.sizes ?? [],
  colors: r.colors ?? [],
  inStock: r.in_stock,
});


// Demo catalog: lets us click through the whole shop before real data exists.
// Reached only via /demo (noindex), never mixed into the live catalog.
const DEMO_BRANDS: Brand[] = [
  { id: "d-b1", slug: "demo-lawn-house", name: "Demo Lawn House", description: "Sample brand for testing. Not a real product.", logoUrl: null, inStock: true },
  { id: "d-b2", slug: "demo-bridal-studio", name: "Demo Bridal Studio", description: "Sample bridal brand for testing.", logoUrl: null, inStock: true },
  { id: "d-b3", slug: "demo-out-of-stock", name: "Demo Sold Out Brand", description: "Shows how an out-of-stock brand looks.", logoUrl: null, inStock: false },
];
const DEMO_PRODUCTS: Product[] = [
  { id: "d-p1", slug: "demo-lawn-3pc", name: "Embroidered Lawn 3-Piece", brandId: "d-b1", description: "Sample stitched suit with size and colour options.", images: [], sellPrice: 8500, weightG: 1000, kind: "stitched", sizes: ["S", "M", "L"], colors: ["Mint", "Peach"], inStock: true },
  { id: "d-p2", slug: "demo-unstitched-chiffon", name: "Unstitched Chiffon Suit", brandId: "d-b1", description: "Sample unstitched suit: no size or colour options.", images: [], sellPrice: 11000, weightG: 900, kind: "unstitched", sizes: [], colors: [], inStock: true },
  { id: "d-p3", slug: "demo-bridal-lehenga", name: "Bridal Lehenga", brandId: "d-b2", description: "Sample bridal outfit, sizes only.", images: [], sellPrice: 65000, weightG: 2500, kind: "stitched", sizes: ["M", "L", "XL"], colors: [], inStock: true },
  { id: "d-p4", slug: "demo-sold-out-kurta", name: "Sold Out Kurta", brandId: "d-b1", description: "Shows an out-of-stock product.", images: [], sellPrice: 4200, weightG: 600, kind: "stitched", sizes: ["S", "M"], colors: ["White"], inStock: false },
];


export async function getBrands(demo = false): Promise<Brand[]> {
  if (demo) return DEMO_BRANDS;
  const db = getDb();
  if (!db) return [];
  const { data, error } = await db
    .from("brands")
    .select(BRAND_COLS)
    .eq("active", true)
    .order("sort")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(toBrand);
}

export async function getBrand(slug: string, demo = false): Promise<Brand | null> {
  if (demo) return DEMO_BRANDS.find((b) => b.slug === slug) ?? null;
  const db = getDb();
  if (!db) return null;
  const { data, error } = await db
    .from("brands")
    .select(BRAND_COLS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toBrand(data) : null;
}

export async function getProducts(
  opts: { brandId?: string; limit?: number; demo?: boolean } = {},
): Promise<Product[]> {
  if (opts.demo) {
    const list = opts.brandId ? DEMO_PRODUCTS.filter((p) => p.brandId === opts.brandId) : DEMO_PRODUCTS;
    return list.slice(0, opts.limit ?? list.length);
  }
  const db = getDb();
  if (!db) return [];
  let q = db
    .from("products")
    .select(PRODUCT_COLS)
    .eq("active", true)
    .order("created_at", { ascending: false });
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
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_COLS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toProduct(data) : null;
}

// True while the live shop has no brand or no product yet: drives the "View demo" button.
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
