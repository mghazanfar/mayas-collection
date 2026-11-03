import "server-only";
import { randomInt } from "node:crypto";
import { getDemoCatalog } from "./catalog";
import { isDemoId, parseColor } from "./product-types";
import { DEMO_RATES, type RateRow } from "./shipping";
import { getSettings } from "./settings";
import { getDb } from "./supabase";

export type CartInput = { productId: string; size: string | null; color: string | null; qty: number }[];

export type PricedLine = {
  productId: string | null;
  name: string;
  size: string | null;
  color: string | null;
  qty: number;
  sellPrice: number;
  buyPrice: number;
  weightG: number;
};

export type LoadedCart = { lines: PricedLine[]; subtotal: number; weightG: number; demo: boolean };

const isStr = (v: unknown, max = 60): v is string => typeof v === "string" && v.length <= max;

// Never trust the browser's prices: every line is re-read from the database.
export async function loadCart(items: unknown): Promise<LoadedCart | { error: string }> {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) return { error: "Your cart is empty." };
  const input: CartInput = [];
  for (const it of items) {
    if (!it || !isStr(it.productId, 64) || !Number.isInteger(it.qty) || it.qty < 1 || it.qty > 10) return { error: "Invalid cart." };
    if ((it.size != null && !isStr(it.size, 20)) || (it.color != null && !isStr(it.color, 60))) return { error: "Invalid cart." };
    input.push({ productId: it.productId, size: it.size ?? null, color: it.color ?? null, qty: it.qty });
  }

  const demoCount = input.filter((i) => isDemoId(i.productId)).length;
  if (demoCount > 0 && demoCount < input.length) return { error: "Remove the demo items from your cart before ordering real products." };
  const demo = demoCount > 0;

  type P = {
    id: string; name: string; sell_price: number; buy_price: number; weight_g: number; sizes: string[];
    sold_out_sizes: string[]; colors: string[]; in_stock: boolean;
  };
  let products = new Map<string, P>();

  if (demo) {
    for (const p of getDemoCatalog().products)
      products.set(p.id, {
        id: p.id, name: p.name, sell_price: p.sellPrice, buy_price: Math.round(p.sellPrice * 0.6), weight_g: p.weightG,
        sizes: p.sizes, sold_out_sizes: p.soldOutSizes, colors: p.colors.map((c) => c.name), in_stock: p.inStock,
      });
  } else {
    const db = getDb();
    if (!db) return { error: "The shop is not connected to its database yet." };
    const ids = [...new Set(input.map((i) => i.productId))];
    if (!ids.every((id) => /^[0-9a-f-]{36}$/i.test(id))) return { error: "Invalid cart." };
    const { data, error } = await db
      .from("products")
      .select("id, name, sell_price, buy_price, weight_g, sizes, sold_out_sizes, colors, in_stock, active, brands(active, in_stock)")
      .in("id", ids);
    if (error) return { error: "Could not load products. Please try again." };
    products = new Map(
      (data ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((r: any) => r.active && r.brands?.active && r.brands?.in_stock)
        .map((r) => [r.id as string, r as unknown as P]),
    );
  }

  const lines: PricedLine[] = [];
  for (const it of input) {
    const p = products.get(it.productId);
    if (!p || !p.in_stock) return { error: "An item in your cart is no longer available. Please remove it." };
    if (p.sizes.length > 0) {
      if (!it.size || !p.sizes.includes(it.size) || p.sold_out_sizes.includes(it.size))
        return { error: `${p.name}: the selected size is not available.` };
    } else if (it.size) return { error: "Invalid cart." };
    const colorNames = p.colors.map((c) => parseColor(c).name);
    if (colorNames.length > 0) {
      if (!it.color || !colorNames.includes(it.color)) return { error: `${p.name}: the selected colour is not available.` };
    } else if (it.color) return { error: "Invalid cart." };
    lines.push({
      productId: demo ? null : p.id,
      name: p.name, size: it.size, color: it.color, qty: it.qty,
      sellPrice: p.sell_price, buyPrice: p.buy_price, weightG: p.weight_g,
    });
  }
  return {
    lines,
    demo,
    subtotal: lines.reduce((n, l) => n + l.sellPrice * l.qty, 0),
    weightG: lines.reduce((n, l) => n + l.weightG * l.qty, 0),
  };
}

// Real orders only use rates the owner has ticked "verified". Demo carts use example rates.
export async function loadRates(demo: boolean): Promise<RateRow[]> {
  if (demo) return DEMO_RATES;
  const db = getDb();
  if (!db) return [];
  const { data } = await db
    .from("shipping_rates")
    .select("courier, zone, up_to_g, price, eta_min_days, eta_max_days")
    .eq("active", true)
    .eq("verified", true);
  return (data ?? []) as RateRow[];
}

export { getSettings };

export function newOrderNumber(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid read-out mistakes
  const rand = Array.from({ length: 5 }, () => alphabet[randomInt(alphabet.length)]).join("");
  return `MC-${ymd}-${rand}`;
}
