import "server-only";
import { getDb } from "./supabase";

export type Settings = {
  announcement: string;
  owner_email: string;
  owner_whatsapp: string;
  ntn: string;
  return_address: string;
  cod_fee: number;
  lahore_handling: number;
  other_city_handling: number;
  gateway_fee_pct: number;
  international_handling: number;
  bank_details: string;
};

export const SETTING_DEFAULTS: Settings = {
  announcement: "",
  owner_email: "",
  owner_whatsapp: "",
  ntn: "",
  return_address: "",
  cod_fee: 300,
  lahore_handling: 100,
  other_city_handling: 200,
  gateway_fee_pct: 0,
  international_handling: 200,
  bank_details: "",
};

export async function getSettings(): Promise<Settings> {
  const db = getDb();
  if (!db) return { ...SETTING_DEFAULTS };
  const { data, error } = await db.from("settings").select("key, value");
  if (error) throw error;
  const out: Record<string, unknown> = { ...SETTING_DEFAULTS };
  for (const row of data ?? []) if (row.key in SETTING_DEFAULTS) out[row.key] = row.value;
  return out as Settings;
}

// Never throws: a settings hiccup must not take the whole storefront down.
export async function getAnnouncement(): Promise<string> {
  try {
    return (await getSettings()).announcement ?? "";
  } catch {
    return "";
  }
}
