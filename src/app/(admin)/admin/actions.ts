"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login, logout, requireAdmin } from "@/lib/admin-auth";
import { getDemoCatalog } from "@/lib/catalog";
import { DEMO_RATES } from "@/lib/shipping";
import { getDb } from "@/lib/supabase";

export type Result = { ok?: true; error?: string } | null;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(String(fd.get(k) ?? "").trim());
const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

function db() {
  const client = getDb();
  if (!client) throw new Error("Database is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return client;
}

// Public pages are cached (ISR); refresh them after any catalog or settings change.
const refreshShop = () => revalidatePath("/", "layout");

export async function loginAction(_prev: Result, fd: FormData): Promise<Result> {
  const res = await login(str(fd, "email"), String(fd.get("password") ?? ""));
  if (!res.ok) return { error: res.error };
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ---------- brands ---------- */

function readBrand(fd: FormData) {
  const name = str(fd, "name");
  const slug = slugify(str(fd, "slug") || name);
  if (!name) return { error: "Name is required." } as const;
  if (!slug) return { error: "Slug could not be created from that name." } as const;
  return {
    value: {
      name: name.slice(0, 120),
      slug,
      description: str(fd, "description").slice(0, 2000),
      sort: Number.isInteger(num(fd, "sort")) ? num(fd, "sort") : 0,
      active: fd.get("active") === "on",
      in_stock: fd.get("in_stock") === "on",
    },
  } as const;
}

const dupMsg = (code?: string) => (code === "23505" ? "A brand with that slug already exists." : null);

export async function createBrand(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const r = readBrand(fd);
  if ("error" in r) return { error: r.error };
  const { error } = await db().from("brands").insert(r.value);
  if (error) return { error: dupMsg(error.code) ?? error.message };
  refreshShop();
  revalidatePath("/admin/brands");
  return { ok: true };
}

export async function updateBrand(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = str(fd, "id");
  const r = readBrand(fd);
  if (!id) return { error: "Missing brand id." };
  if ("error" in r) return { error: r.error };
  const { error } = await db().from("brands").update(r.value).eq("id", id);
  if (error) return { error: dupMsg(error.code) ?? error.message };
  refreshShop();
  revalidatePath("/admin/brands");
  return { ok: true };
}

// Deleting a brand also deletes its products (FK cascade); past orders keep their snapshots.
export async function deleteBrand(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return { error: "Missing brand id." };
  const { error } = await db().from("brands").delete().eq("id", id);
  if (error) return { error: error.message };
  refreshShop();
  revalidatePath("/admin/brands");
  return { ok: true };
}

/* ---------- settings ---------- */

export async function saveSettings(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const email = str(fd, "owner_email");
  const phone = str(fd, "owner_whatsapp").replace(/[\s-]/g, "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid owner email." };
  if (!/^\+\d{8,15}$/.test(phone)) return { error: "WhatsApp number must be international, e.g. +923001234567." };

  const money = (k: string, label: string) => {
    const n = num(fd, k);
    if (!Number.isInteger(n) || n < 0 || n > 100000) throw new Error(`${label} must be a whole number between 0 and 100000.`);
    return n;
  };
  try {
    const pct = num(fd, "gateway_fee_pct");
    if (!(pct >= 0 && pct <= 20)) throw new Error("Gateway fee % must be between 0 and 20.");
    const rows = [
      { key: "announcement", value: str(fd, "announcement").slice(0, 200) },
      { key: "owner_email", value: email },
      { key: "owner_whatsapp", value: phone },
      { key: "ntn", value: str(fd, "ntn").slice(0, 30) },
      { key: "return_address", value: str(fd, "return_address").slice(0, 500) },
      { key: "cod_fee", value: money("cod_fee", "COD fee") },
      { key: "lahore_handling", value: money("lahore_handling", "Lahore handling") },
      { key: "other_city_handling", value: money("other_city_handling", "Other-city handling") },
      { key: "gateway_fee_pct", value: pct },
      { key: "international_handling", value: money("international_handling", "International handling") },
      { key: "bank_details", value: str(fd, "bank_details").slice(0, 1000) },
    ];
    const { error } = await db().from("settings").upsert(rows);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}

/* ---------- products ---------- */

const list = (raw: string, max: number, sep = /[,\n]/) =>
  [...new Set(raw.split(sep).map((s) => s.trim()).filter(Boolean))].slice(0, max);

const okImage = (u: string) => /^https:\/\/res\.cloudinary\.com\/[\w./%-]+$/.test(u) || /^\/demo\/[\w.-]+\.svg$/.test(u);

function readProduct(fd: FormData) {
  const name = str(fd, "name");
  const slug = slugify(str(fd, "slug") || name);
  const brandId = str(fd, "brand_id");
  if (!name) return { error: "Name is required." } as const;
  if (!slug) return { error: "Slug could not be created from that name." } as const;
  if (!brandId) return { error: "Choose a brand." } as const;

  const sell = num(fd, "sell_price");
  const buy = num(fd, "buy_price");
  const compareRaw = str(fd, "compare_price");
  const compare = compareRaw === "" ? null : Number(compareRaw);
  const weight = num(fd, "weight_g");
  if (!Number.isInteger(sell) || sell <= 0) return { error: "Selling price must be a whole number above 0." } as const;
  if (!Number.isInteger(buy) || buy < 0) return { error: "Buying price must be a whole number (0 or more)." } as const;
  if (compare !== null && (!Number.isInteger(compare) || compare <= sell))
    return { error: "Original (crossed-out) price must be higher than the selling price, or left empty." } as const;
  if (!Number.isInteger(weight) || weight < 50 || weight > 20000) return { error: "Weight must be 50–20000 grams." } as const;

  const kind = str(fd, "kind");
  if (!["stitched", "unstitched", "other"].includes(kind)) return { error: "Invalid type." } as const;

  const images = list(String(fd.get("images") ?? ""), 12, /\n/);
  if (!images.every(okImage)) return { error: "An image URL is not allowed. Upload photos with the uploader." } as const;

  // Unstitched dresses have no size/colour choice, whatever was typed.
  const sizes = kind === "unstitched" ? [] : list(str(fd, "sizes"), 20);
  const colors = kind === "unstitched" ? [] : list(str(fd, "colors"), 20, /\n|,(?!\s*#)/).map((c) => c.slice(0, 40));
  const soldOut = list(str(fd, "sold_out_sizes"), 20).filter((s) => sizes.includes(s));

  // "Mint: 1" means: choosing Mint shows photo #1.
  const colorImages: Record<string, number> = {};
  for (const line of String(fd.get("color_images") ?? "").split("\n")) {
    const [c, n] = line.split(":").map((s) => s.trim());
    const idx = Number(n) - 1;
    if (c && Number.isInteger(idx) && idx >= 0 && idx < images.length) colorImages[c] = idx;
  }

  return {
    value: {
      name: name.slice(0, 160),
      slug,
      brand_id: brandId,
      description: str(fd, "description").slice(0, 5000),
      details: str(fd, "details").slice(0, 3000),
      fabric: str(fd, "fabric").slice(0, 120),
      model_info: str(fd, "model_info").slice(0, 300),
      images,
      sell_price: sell,
      buy_price: buy,
      compare_price: compare,
      weight_g: weight,
      kind,
      sizes,
      sold_out_sizes: soldOut,
      colors,
      color_images: colorImages,
      in_stock: fd.get("in_stock") === "on",
      active: fd.get("active") === "on",
    },
  } as const;
}

const dupProduct = (code?: string) => (code === "23505" ? "A product with that slug already exists." : null);

export async function createProduct(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const r = readProduct(fd);
  if ("error" in r) return { error: r.error };
  const { error } = await db().from("products").insert(r.value);
  if (error) return { error: dupProduct(error.code) ?? error.message };
  refreshShop();
  redirect("/admin/products");
}

export async function updateProduct(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = str(fd, "id");
  const r = readProduct(fd);
  if (!id) return { error: "Missing product id." };
  if ("error" in r) return { error: r.error };
  const { error } = await db().from("products").update(r.value).eq("id", id);
  if (error) return { error: dupProduct(error.code) ?? error.message };
  refreshShop();
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteProduct(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = str(fd, "id");
  if (!id) return { error: "Missing product id." };
  const { error } = await db().from("products").delete().eq("id", id);
  if (error) return { error: error.message };
  refreshShop();
  redirect("/admin/products");
}

// Copies the demo catalog into the real database so the whole flow (cart, checkout, orders)
// can be tried end to end. Everything is slug-prefixed "demo-" and removable from the admin.
export async function importSample(_prev: Result, _fd: FormData): Promise<Result> {
  await requireAdmin();
  void _fd;
  const { brands, products } = getDemoCatalog();
  const client = db();
  const { data: brandRows, error: be } = await client
    .from("brands")
    .upsert(brands.map((b, i) => ({ slug: b.slug, name: b.name, description: b.description, in_stock: b.inStock, sort: i })), { onConflict: "slug" })
    .select("id, slug");
  if (be) return { error: be.message };
  const idBySlug = new Map((brandRows ?? []).map((b) => [b.slug as string, b.id as string]));

  const rows = products.map((p) => ({
    slug: p.slug,
    brand_id: idBySlug.get(p.brandSlug)!,
    name: p.name,
    description: p.description,
    details: p.details,
    fabric: p.fabric,
    model_info: p.modelInfo,
    images: p.images,
    sell_price: p.sellPrice,
    compare_price: p.comparePrice,
    buy_price: Math.round(p.sellPrice * 0.6),
    weight_g: p.weightG,
    kind: p.kind,
    sizes: p.sizes,
    sold_out_sizes: p.soldOutSizes,
    colors: p.colors.map((c) => (c.hex ? `${c.name}|${c.hex}` : c.name)),
    color_images: p.colorImages,
    in_stock: p.inStock,
  }));
  const { error: pe } = await client.from("products").upsert(rows, { onConflict: "slug" });
  if (pe) return { error: pe.message };
  refreshShop();
  revalidatePath("/admin/products");
  return { ok: true };
}

/* ---------- orders & returns ---------- */

const ORDER_STATUS = ["pending", "paid", "packed", "shipped", "delivered", "cancelled", "returned"];
const PAYMENT_STATUS = ["unpaid", "awaiting_payment", "review", "failed", "paid", "refunded"];

export async function updateOrder(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  const payment = str(fd, "payment_status");
  if (!id || !ORDER_STATUS.includes(status) || !PAYMENT_STATUS.includes(payment)) return { error: "Invalid status." };
  const costRaw = str(fd, "shipping_cost");
  const cost = costRaw === "" ? null : Number(costRaw);
  if (cost !== null && (!Number.isInteger(cost) || cost < 0 || cost > 1_000_000)) return { error: "Courier cost must be a whole number (PKR) or empty." };

  const client = db();
  const { data: cur } = await client.from("orders").select("delivered_at").eq("id", id).maybeSingle();
  const patch: Record<string, unknown> = {
    status,
    payment_status: payment,
    tracking_no: str(fd, "tracking_no").slice(0, 60) || null,
    shipping_cost: cost,
    admin_note: str(fd, "admin_note").slice(0, 1000),
    delivered_at: status === "delivered" ? (cur?.delivered_at ?? new Date().toISOString()) : null,
  };
  // Cash on delivery is paid when the parcel is delivered.
  const { error } = await client.from("orders").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

const RETURN_STATUS = ["requested", "approved", "rejected", "received", "refunded", "call_scheduled"];

export async function updateReturn(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!id || !RETURN_STATUS.includes(status)) return { error: "Invalid status." };
  const client = db();
  const { data, error } = await client.from("returns").update({ status, admin_note: str(fd, "admin_note").slice(0, 1000) }).eq("id", id).select("order_id").single();
  if (error) return { error: error.message };
  if (status === "refunded" && data) await client.from("orders").update({ status: "returned", payment_status: "refunded" }).eq("id", data.order_id);
  revalidatePath("/admin", "layout");
  return { ok: true };
}

/* ---------- shipping rates ---------- */

function readRate(fd: FormData) {
  const courier = str(fd, "courier");
  const zone = str(fd, "zone");
  const n = (k: string) => num(fd, k);
  if (!["pakpost", "tcs", "leopard"].includes(courier) || !["lahore", "pakistan", "international"].includes(zone)) return { error: "Invalid courier or zone." } as const;
  const up = n("up_to_g"), price = n("price"), lo = n("eta_min_days"), hi = n("eta_max_days");
  if (![up, price, lo, hi].every(Number.isInteger) || up < 1 || price < 0 || lo < 1 || hi < lo) return { error: "Check the numbers: weight ≥ 1, price ≥ 0, delivery days min ≥ 1 and max ≥ min." } as const;
  return {
    value: {
      courier, zone, up_to_g: up, price, eta_min_days: lo, eta_max_days: hi,
      active: fd.get("active") === "on", verified: fd.get("verified") === "on", service: str(fd, "service").slice(0, 40),
    },
  } as const;
}

export async function createRate(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const r = readRate(fd);
  if ("error" in r) return { error: r.error };
  const { error } = await db().from("shipping_rates").insert(r.value);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function updateRate(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const id = str(fd, "id");
  const r = readRate(fd);
  if (!id) return { error: "Missing id." };
  if ("error" in r) return { error: r.error };
  const { error } = await db().from("shipping_rates").update(r.value).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { ok: true };
}

export async function deleteRate(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const { error } = await db().from("shipping_rates").delete().eq("id", str(fd, "id"));
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { ok: true };
}

// Placeholder rows so the table isn't empty. They are NOT real courier prices and start
// unverified, so customers never see them until the owner replaces the numbers and ticks "verified".
export async function loadExampleRates(_prev: Result, _fd: FormData): Promise<Result> {
  await requireAdmin();
  void _fd;
  const rows = DEMO_RATES.map((r) => ({ ...r, active: true, verified: false, service: "EXAMPLE" }));
  const { error } = await db().from("shipping_rates").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/admin/shipping");
  return { ok: true };
}
