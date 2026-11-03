import "server-only";
import { notifyNewOrder, notifyOwnerText } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { ONLINE_METHODS, type OnlineMethod } from "@/lib/shipping";
import { getDb } from "@/lib/supabase";
import { easypaisa } from "./easypaisa";
import { jazzcash } from "./jazzcash";
import { safepay } from "./safepay";
import type { Provider, StartInput, StartResult, Verdict } from "./types";

export type { StartResult } from "./types";

const PROVIDERS: Record<OnlineMethod, Provider> = { safepay, jazzcash, easypaisa };

export const getProvider = (id: string): Provider | null => (ONLINE_METHODS as readonly string[]).includes(id) ? PROVIDERS[id as OnlineMethod] : null;

// A method only appears at checkout once its keys are set, so nothing half-configured is ever offered.
export const configuredOnline = (): OnlineMethod[] => ONLINE_METHODS.filter((m) => PROVIDERS[m].configured());

// Opens a payment attempt for an order and returns where to send the customer.
export async function startPayment(
  id: OnlineMethod,
  orderId: string,
  input: Omit<StartInput, "reference">,
): Promise<StartResult> {
  const db = getDb();
  if (!db) throw new Error("no database");
  const p = PROVIDERS[id];
  const { reference, go } = await p.start({ ...input, reference: "" });
  const { error } = await db.from("payments").insert({ order_id: orderId, provider: id, reference, amount: input.amount });
  if (error) throw error;
  return go;
}

const OPEN = ["awaiting_payment", "failed", "review", "unpaid"];

// Applies a gateway verdict to the order. Safe to call more than once for the same payment.
export async function settlePayment(id: OnlineMethod, v: Verdict): Promise<{ number: string; paid: boolean } | null> {
  const db = getDb();
  if (!db) return null;
  const { data: pay } = await db.from("payments").select("id, order_id, amount, status").eq("provider", id).eq("reference", v.reference).maybeSingle();
  if (!pay) return null;
  const { data: order } = await db.from("orders").select("id, number, payment_status, total").eq("id", pay.order_id).single();
  if (!order) return null;

  // The amount must match what we asked for; anything else needs a human.
  let status = v.status;
  if (status === "paid" && ((v.amount !== undefined && v.amount !== pay.amount) || pay.amount !== order.total)) status = "review";

  if (order.payment_status === "paid") return { number: order.number, paid: true }; // already settled
  await db.from("payments").update({ status, updated_at: new Date().toISOString() }).eq("id", pay.id).neq("status", "paid");

  if (status === "paid") {
    const { data: done } = await db
      .from("orders")
      .update({ payment_status: "paid", status: "paid" })
      .eq("id", order.id)
      .in("payment_status", OPEN)
      .eq("status", "pending")
      .select("id");
    // Only the call that actually flips it to paid sends alerts, so a refreshed return page can't double-notify.
    if (done?.length) await notifyPaid(order.id).catch((e) => console.error("[notify] failed", e));
    else await db.from("orders").update({ payment_status: "paid" }).eq("id", order.id).in("payment_status", OPEN);
    return { number: order.number, paid: true };
  }

  await db.from("orders").update({ payment_status: status === "failed" ? "failed" : "review" }).eq("id", order.id).eq("payment_status", "awaiting_payment");
  if (status === "review") {
    const s = await getSettings();
    await notifyOwnerText(s.owner_email, `Check payment for order ${order.number}`, `A ${id} payment came back for order ${order.number} (PKR ${order.total}) but could not be verified automatically. Please confirm it in the ${id} merchant portal, then set the order to Paid in the admin.`).catch(() => {});
  }
  return { number: order.number, paid: false };
}

async function notifyPaid(orderId: string) {
  const db = getDb();
  if (!db) return;
  const { data: o } = await db
    .from("orders")
    .select("number, total, city, country, customer_name, email, phone, payment_method, order_items(name, size, color, qty, sell_price)")
    .eq("id", orderId)
    .single();
  if (!o) return;
  const items = (o.order_items as { name: string; size: string | null; color: string | null; qty: number; sell_price: number }[]) ?? [];
  const itemsText = items.map((l) => `${l.qty} x ${l.name}${l.size ? ` (${l.size})` : ""}${l.color ? ` ${l.color}` : ""} - PKR ${(l.sell_price * l.qty).toLocaleString("en-PK")}`).join("\n");
  const s = await getSettings();
  await notifyNewOrder(
    { number: o.number, total: o.total, city: o.city, country: o.country, customerName: o.customer_name, customerEmail: o.email, customerPhone: o.phone, paymentMethod: `${o.payment_method} (PAID)`, itemsText },
    s.owner_email,
    s.owner_whatsapp,
  );
}
