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

// Shown only while Supabase env vars are missing (local dev before setup).
const DEMO_BRANDS: Brand[] = [
  { id: "b1", slug: "demo-brand", name: "Demo Brand", description: "Sample brand shown until the database is connected.", logoUrl: null, inStock: true },
];
const DEMO_PRODUCTS: Product[] = [
  { id: "p1", slug: "demo-lawn-3pc", name: "Embroidered Lawn 3-Piece", brandId: "b1", description: "Sample product.", images: [], sellPrice: 8500, weightG: 1000, kind: "stitched", sizes: ["S", "M", "L"], colors: ["Mint", "Peach"], inStock: true },
  { id: "p2", slug: "demo-unstitched", name: "Unstitched Chiffon Suit", brandId: "b1", description: "Sample product, no size or colour options.", images: [], sellPrice: 11000, weightG: 900, kind: "unstitched", sizes: [], colors: [], inStock: true },
];

export async function getBrands(): Promise<Brand[]> {
  const db = getDb();
  if (!db) return DEMO_BRANDS;
  const { data, error } = await db
    .from("brands")
    .select(BRAND_COLS)
    .eq("active", true)
    .order("sort")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(toBrand);
}

export async function getBrand(slug: string): Promise<Brand | null> {
  const db = getDb();
  if (!db) return DEMO_BRANDS.find((b) => b.slug === slug) ?? null;
  const { data, error } = await db
    .from("brands")
    .select(BRAND_COLS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toBrand(data) : null;
}

export async function getProducts(opts: { brandId?: string; limit?: number } = {}): Promise<Product[]> {
  const db = getDb();
  if (!db) {
    const list = opts.brandId ? DEMO_PRODUCTS.filter((p) => p.brandId === opts.brandId) : DEMO_PRODUCTS;
    return list.slice(0, opts.limit ?? list.length);
  }
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

export async function getProduct(slug: string): Promise<Product | null> {
  const db = getDb();
  if (!db) return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_COLS)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  return data ? toProduct(data) : null;
}
