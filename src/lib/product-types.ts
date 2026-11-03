// Shared (client + server) catalog types and pure helpers. No server-only imports here.

export type Brand = {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  inStock: boolean;
};

export type Color = { name: string; hex: string | null };

export type Product = {
  id: string;
  slug: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  name: string;
  description: string;
  details: string;
  fabric: string;
  modelInfo: string;
  images: string[];
  sellPrice: number;
  comparePrice: number | null;
  weightG: number;
  kind: "stitched" | "unstitched" | "other";
  sizes: string[];
  soldOutSizes: string[];
  colors: Color[];
  colorImages: Record<string, number>;
  inStock: boolean;
  createdAt: string;
};

// Stored as "Name" or "Name|#hex" so admin can type colours in one line.
export function parseColor(raw: string): Color {
  const [name, hex] = raw.split("|").map((s) => s.trim());
  return { name, hex: hex && /^#[0-9a-f]{3,8}$/i.test(hex) ? hex : null };
}

export const discountPct = (p: Pick<Product, "sellPrice" | "comparePrice">): number =>
  p.comparePrice && p.comparePrice > p.sellPrice ? Math.round((1 - p.sellPrice / p.comparePrice) * 100) : 0;

// A product is purchasable if it's in stock and (it has no sizes or at least one size is available).
export const availableSizes = (p: Pick<Product, "sizes" | "soldOutSizes">): string[] =>
  p.sizes.filter((s) => !p.soldOutSizes.includes(s));

export const isPurchasable = (p: Product): boolean =>
  p.inStock && (p.sizes.length === 0 || availableSizes(p).length > 0);

export const isDemoId = (id: string): boolean => id.startsWith("d-");
