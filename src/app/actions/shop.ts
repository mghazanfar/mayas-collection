"use server";

import { isLang, type Lang } from "@/lib/i18n";
import { loadCart, loadRates, newOrderNumber } from "@/lib/orders";
import { configuredOnline, startPayment, type StartResult } from "@/lib/payments";
import { SITE_URL } from "@/lib/site";
import { notifyNewOrder } from "@/lib/notify";
import { tooMany } from "@/lib/rate-limit";
import { getSettings } from "@/lib/settings";
import {
  COUNTRIES, allowedPayments, isOnline, orderTotals, shippingOptions, zoneFor,
  type Courier, type PaymentMethod, type ShippingOption,
} from "@/lib/shipping";
import { getDb } from "@/lib/supabase";

export type Quote =
  | { error: string }
  | {
      options: ShippingOption[];
      payments: PaymentMethod[];
      fees: { cod_fee: number; gateway_fee_pct: number };
      subtotal: number;
      demo: boolean;
      bankDetails: string;
    };

export async function getQuote(items: unknown, country: string, city: string): Promise<Quote> {
  if (!(COUNTRIES as readonly string[]).includes(country)) return { error: "Choose a country." };
  const cart = await loadCart(items);
  if ("error" in cart) return cart;
  const [rates, s] = await Promise.all([loadRates(cart.demo), getSettings()]);
  const zone = zoneFor(country, city);
  const options = shippingOptions(rates, zone, cart.weightG, s);
  const online = configuredOnline();
  return {
    options,
    payments: allowedPayments(zone).filter((m) => !isOnline(m) || online.includes(m)),
    fees: { cod_fee: s.cod_fee, gateway_fee_pct: s.gateway_fee_pct },
    subtotal: cart.subtotal,
    demo: cart.demo,
    bankDetails: s.bank_details,
  };
}

export type PlaceResult =
  | { ok: false; error: string }
  | { ok: true; number: string; total: number; payment: PaymentMethod; demo: boolean; bankDetails: string; eta: string; pay?: StartResult };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function phoneFor(country: string, raw: string): string | null {
  let p = raw.replace(/[\s().-]/g, "");
  if (country === "Pakistan" && /^0\d{10}$/.test(p)) p = `+92${p.slice(1)}`;
  if (country === "Pakistan" && /^92\d{10}$/.test(p)) p = `+${p}`;
  return /^\+\d{8,15}$/.test(p) ? p : null;
}

export async function placeOrder(input: {
  items: unknown;
  name: string; email: string; phone: string; country: string; city: string; address: string; postal: string; note: string;
  courier: string; payment: string; lang?: string;
}): Promise<PlaceResult> {
  if (await tooMany("order", 8, 10 * 60_000)) return { ok: false, error: "Too many attempts. Please wait a few minutes." };

  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const city = String(input.city ?? "").trim();
  const address = String(input.address ?? "").trim();
  const postal = String(input.postal ?? "").trim();
  const note = String(input.note ?? "").trim().slice(0, 300);
  const country = String(input.country ?? "");

  if (name.length < 2 || name.length > 80) return { ok: false, error: "Please enter your full name." };
  if (!EMAIL.test(email) || email.length > 120) return { ok: false, error: "Please enter a valid email address." };
  if (!(COUNTRIES as readonly string[]).includes(country)) return { ok: false, error: "Please choose a country." };
  const phone = phoneFor(country, String(input.phone ?? ""));
  if (!phone) return { ok: false, error: "Phone number must be in international format, e.g. +971501234567 (Pakistan: 03001234567)." };
  if (city.length < 2 || city.length > 60) return { ok: false, error: "Please enter your city." };
  if (address.length < 8 || address.length > 300) return { ok: false, error: "Please enter your full delivery address." };
  if (postal.length > 12) return { ok: false, error: "Postal code is too long." };

  const cart = await loadCart(input.items);
  if ("error" in cart) return { ok: false, error: cart.error };

  const [rates, s] = await Promise.all([loadRates(cart.demo), getSettings()]);
  const zone = zoneFor(country, city);
  const option = shippingOptions(rates, zone, cart.weightG, s).find((o) => o.courier === (input.courier as Courier));
  if (!option) return { ok: false, error: "That delivery option is not available for your address. Please choose another." };
  const payment = input.payment as PaymentMethod;
  if (!allowedPayments(zone).includes(payment)) return { ok: false, error: "That payment method is not available for your address." };
  const lang: Lang = isLang(String(input.lang ?? "")) ? (input.lang as Lang) : "en";
  if (isOnline(payment) && !configuredOnline().includes(payment)) return { ok: false, error: "That payment method is not available right now. Please choose another." };

  const t = orderTotals(cart.subtotal, option.fee, payment, s);
  const eta = `${option.etaMin}–${option.etaMax} working days`;

  // Demo carts are only simulated: nothing is saved and nobody is notified.
  if (cart.demo) {
    return { ok: true, number: `DEMO-${newOrderNumber().slice(3)}`, total: t.total, payment, demo: true, bankDetails: s.bank_details, eta };
  }

  const db = getDb();
  if (!db) return { ok: false, error: "The shop is not connected to its database yet." };

  let number = "";
  let orderId = "";
  for (let attempt = 0; attempt < 3 && !orderId; attempt++) {
    number = newOrderNumber();
    const { data, error } = await db
      .from("orders")
      .insert({
        number, status: "pending", customer_name: name, email, phone, country, city, address,
        postal_code: postal || null, courier: option.courier, payment_method: payment, payment_status: isOnline(payment) ? "awaiting_payment" : "unpaid",
        subtotal: cart.subtotal, shipping_fee: option.fee, gateway_fee: t.gatewayFee, cod_fee: t.codFee, total: t.total,
        shipping_eta: eta, customer_note: note, weight_g: cart.weightG,
      })
      .select("id")
      .single();
    if (data) orderId = data.id as string;
    else if (error?.code !== "23505") return { ok: false, error: "Could not save your order. Please try again." };
  }
  if (!orderId) return { ok: false, error: "Could not save your order. Please try again." };

  const { error: ie } = await db.from("order_items").insert(
    cart.lines.map((l) => ({
      order_id: orderId, product_id: l.productId, name: l.name, size: l.size, color: l.color,
      qty: l.qty, sell_price: l.sellPrice, buy_price: l.buyPrice,
    })),
  );
  if (ie) {
    await db.from("orders").delete().eq("id", orderId); // don't leave an order with no items
    return { ok: false, error: "Could not save your order. Please try again." };
  }

  // Online payment: no alerts until the money is confirmed (see settlePayment). Send the customer to the gateway.
  if (isOnline(payment)) {
    try {
      const pay = await startPayment(payment, orderId, {
        orderNumber: number, amount: t.total, email, phone, name,
        returnUrl: `${SITE_URL}/api/pay/${payment}/return?lang=${lang}`,
        cancelUrl: `${SITE_URL}/api/pay/${payment}/return?lang=${lang}&cancel=1`,
      });
      return { ok: true, number, total: t.total, payment, demo: false, bankDetails: s.bank_details, eta, pay };
    } catch (e) {
      console.error("[pay] start failed", e);
      await db.from("orders").delete().eq("id", orderId); // nothing was charged; don't leave a dead order
      return { ok: false, error: "We couldn't start the online payment. Please try again or choose another payment method." };
    }
  }

  const itemsText = cart.lines.map((l) => `${l.qty} x ${l.name}${l.size ? ` (${l.size})` : ""}${l.color ? ` ${l.color}` : ""} - PKR ${(l.sellPrice * l.qty).toLocaleString("en-PK")}`).join("\n");
  await notifyNewOrder(
    { number, total: t.total, city, country, customerName: name, customerEmail: email, customerPhone: phone, paymentMethod: payment, itemsText },
    s.owner_email,
    s.owner_whatsapp,
  ).catch((e) => console.error("[notify] failed", e));

  return { ok: true, number, total: t.total, payment, demo: false, bankDetails: s.bank_details, eta };
}

/* ---------- order lookup & returns (customer asks with order number + email) ---------- */

export type TrackResult =
  | { error: string }
  | {
      number: string; status: string; courier: string; trackingNo: string | null; eta: string; createdAt: string;
      subtotal: number; shipping: number; fees: number; total: number; paymentMethod: string; paymentStatus: string;
      items: { name: string; size: string | null; color: string | null; qty: number; price: number }[];
      returnStatus: string | null;
    };

const NOT_FOUND = "We couldn't find an order with that number and email.";

async function findOrder(number: string, email: string) {
  const db = getDb();
  if (!db) return null;
  const { data } = await db
    .from("orders")
    .select("id, number, status, courier, tracking_no, shipping_eta, created_at, subtotal, shipping_fee, cod_fee, gateway_fee, total, payment_method, payment_status, email, order_items(name, size, color, qty, sell_price), returns(status)")
    .eq("number", number.trim().toUpperCase())
    .eq("email", email.trim().toLowerCase()) // eq, not ilike: "%" must not act as a wildcard
    .maybeSingle();
  return data;
}

export async function trackOrder(number: string, email: string): Promise<TrackResult> {
  if (await tooMany("track", 10, 10 * 60_000)) return { error: "Too many attempts. Please wait a few minutes." };
  if (!number || !email || number.length > 40 || email.length > 120) return { error: NOT_FOUND };
  const o = await findOrder(number, email);
  if (!o) return { error: NOT_FOUND };
  const r = (o.returns as { status: string }[] | null) ?? [];
  return {
    number: o.number, status: o.status, courier: o.courier, trackingNo: o.tracking_no, eta: o.shipping_eta, createdAt: o.created_at,
    subtotal: o.subtotal, shipping: o.shipping_fee, fees: o.cod_fee + o.gateway_fee, total: o.total,
    paymentMethod: o.payment_method, paymentStatus: o.payment_status,
    items: ((o.order_items as { name: string; size: string | null; color: string | null; qty: number; sell_price: number }[]) ?? []).map((i) => ({ name: i.name, size: i.size, color: i.color, qty: i.qty, price: i.sell_price })),
    returnStatus: r[0]?.status ?? null,
  };
}

export async function requestReturn(number: string, email: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (await tooMany("return", 5, 60 * 60_000)) return { ok: false, error: "Too many attempts. Please try again later." };
  const text = String(reason ?? "").trim();
  if (text.length < 10 || text.length > 1000) return { ok: false, error: "Please describe the problem (10–1000 characters)." };
  const o = await findOrder(String(number ?? ""), String(email ?? ""));
  if (!o) return { ok: false, error: NOT_FOUND };
  if (!["shipped", "delivered"].includes(o.status)) return { ok: false, error: "Returns can be requested once your order has been shipped." };
  if (((o.returns as unknown[]) ?? []).length > 0) return { ok: false, error: "A return has already been requested for this order." };
  const db = getDb();
  if (!db) return { ok: false, error: "Please try again later." };
  const { error } = await db.from("returns").insert({ order_id: o.id, reason: text });
  return error ? { ok: false, error: "Could not submit your request. Please try again." } : { ok: true };
}
