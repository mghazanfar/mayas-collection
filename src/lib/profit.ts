import "server-only";
import { getDb } from "./supabase";

export type ProfitSummary = {
  orders: number;
  itemsRevenue: number; // what customers paid for the dresses
  itemsCost: number; // what we paid for them (buying price x qty)
  shippingCharged: number; // delivery + handling collected from customers
  shippingPaid: number; // what the couriers actually charged us
  codFees: number; // COD fee collected from customers
  gatewayFees: number; // card/wallet fees (cost to us)
  profit: number;
  missingShippingCost: number; // delivered orders where the real courier cost wasn't entered
};

const empty = (): ProfitSummary => ({ orders: 0, itemsRevenue: 0, itemsCost: 0, shippingCharged: 0, shippingPaid: 0, codFees: 0, gatewayFees: 0, profit: 0, missingShippingCost: 0 });

// Profit only counts DELIVERED orders:
//   profit = (item sales - item cost) + (delivery charged - courier cost) + COD fees - gateway fees
export async function profitReport(): Promise<{ all: ProfitSummary; last30: ProfitSummary } | null> {
  const db = getDb();
  if (!db) return null;
  const { data, error } = await db
    .from("orders")
    .select("delivered_at, shipping_fee, shipping_cost, cod_fee, gateway_fee, order_items(qty, sell_price, buy_price)")
    .eq("status", "delivered");
  if (error) return null;

  const all = empty();
  const last30 = empty();
  const since = Date.now() - 30 * 86_400_000;
  for (const o of data ?? []) {
    const items = (o.order_items as { qty: number; sell_price: number; buy_price: number }[]) ?? [];
    const rev = items.reduce((n, i) => n + i.qty * i.sell_price, 0);
    const cost = items.reduce((n, i) => n + i.qty * i.buy_price, 0);
    const targets = [all, ...(o.delivered_at && new Date(o.delivered_at).getTime() >= since ? [last30] : [])];
    for (const t of targets) {
      t.orders += 1;
      t.itemsRevenue += rev;
      t.itemsCost += cost;
      t.shippingCharged += o.shipping_fee;
      t.shippingPaid += o.shipping_cost ?? 0;
      t.codFees += o.cod_fee;
      t.gatewayFees += o.gateway_fee;
      if (o.shipping_cost == null) t.missingShippingCost += 1;
    }
  }
  for (const t of [all, last30]) t.profit = t.itemsRevenue - t.itemsCost + t.shippingCharged - t.shippingPaid + t.codFees - t.gatewayFees;
  return { all, last30 };
}
