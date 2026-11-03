"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { login, logout, requireAdmin } from "@/lib/admin-auth";
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
      { key: "owner_email", value: email },
      { key: "owner_whatsapp", value: phone },
      { key: "ntn", value: str(fd, "ntn").slice(0, 30) },
      { key: "return_address", value: str(fd, "return_address").slice(0, 500) },
      { key: "cod_fee", value: money("cod_fee", "COD fee") },
      { key: "lahore_handling", value: money("lahore_handling", "Lahore handling") },
      { key: "other_city_handling", value: money("other_city_handling", "Other-city handling") },
      { key: "gateway_fee_pct", value: pct },
    ];
    const { error } = await db().from("settings").upsert(rows);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save." };
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}
