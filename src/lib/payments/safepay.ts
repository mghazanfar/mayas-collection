import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Provider, Verdict } from "./types";

// Safepay Express Checkout (hosted page), per https://safepay-docs.netlify.app/build-your-integration/express-checkout/
//   SAFEPAY_PUBLIC_KEY      the "merchant_api_key" (public key) of your account
//   SAFEPAY_SECRET_KEY      the secret key, sent as the x-sfpy-merchant-secret header (server only)
//   SAFEPAY_WEBHOOK_SECRET  shared secret from Developers > Endpoints (verifies webhooks; optional but recommended)
//   SAFEPAY_ENV             "production" for live; anything else = sandbox
const prod = () => process.env.SAFEPAY_ENV === "production";
const API = () => (prod() ? "https://api.getsafepay.com" : "https://sandbox.api.getsafepay.com");
// The hosted checkout lives on a different host from the API (taken from Safepay's official Node SDK).
const CHECKOUT = () => (prod() ? "https://getsafepay.com/embedded/" : "https://sandbox.api.getsafepay.com/embedded/");

async function call(path: string, init: { method: string; body?: unknown }) {
  const res = await fetch(`${API()}${path}`, {
    method: init.method,
    headers: { Accept: "application/json", "Content-Type": "application/json", "x-sfpy-merchant-secret": process.env.SAFEPAY_SECRET_KEY! },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const json = (await res.json().catch(() => null)) as { data?: unknown } | null;
  if (!res.ok || !json) throw new Error(`Safepay ${path} failed (${res.status})`);
  return json.data;
}

export const safepay: Provider = {
  id: "safepay",
  label: "Card (Visa / Mastercard) via Safepay",
  configured: () => !!process.env.SAFEPAY_PUBLIC_KEY && !!process.env.SAFEPAY_SECRET_KEY,

  async start(i) {
    // 1. payment session ("tracker"). Amounts are in the lowest denomination: PKR paisa.
    const session = (await call("/order/payments/v3/", {
      method: "POST",
      body: {
        merchant_api_key: process.env.SAFEPAY_PUBLIC_KEY,
        intent: "CYBERSOURCE",
        mode: "payment",
        currency: "PKR",
        amount: i.amount * 100,
        metadata: { order_id: i.orderNumber },
      },
    })) as { tracker?: { token?: string } } | null;
    const tracker = session?.tracker?.token;
    // 2. short-lived token that authorises the hosted page
    const tbt = (await call("/client/passport/v1/token", { method: "POST" })) as string | null;
    if (!tracker || !tbt) throw new Error("Safepay: missing tracker or token");

    const q = new URLSearchParams({
      environment: prod() ? "production" : "sandbox",
      tracker,
      tbt,
      source: "hosted",
      redirect_url: i.returnUrl,
      cancel_url: i.cancelUrl,
    });
    return { reference: tracker, go: { kind: "redirect", url: `${CHECKOUT()}?${q}` } };
  },

  async parseReturn(req) {
    const u = new URL(req.url);
    if (u.searchParams.get("cancel")) return null;
    const tracker = u.searchParams.get("tracker");
    if (!tracker) return null;
    // Never trust the redirect itself: ask Safepay what state this tracker is really in.
    const res = await fetch(`${API()}/reporter/api/v1/payments/${encodeURIComponent(tracker)}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return { reference: tracker, status: "review" };
    const json = (await res.json().catch(() => null)) as { data?: Record<string, unknown> } | null;
    const d = (json?.data ?? {}) as { tracker?: Record<string, unknown> } & Record<string, unknown>;
    const t = (d.tracker ?? d) as { state?: string; purchase_totals?: { base_amount?: { currency?: string; amount?: number } } };
    const base = t.purchase_totals?.base_amount;
    const amount = base?.currency === "PKR" && typeof base.amount === "number" ? base.amount / 100 : undefined;
    // TRACKER_ENDED = paid. Anything else means money has not been captured (a late webhook can still settle it).
    return { reference: tracker, status: t.state === "TRACKER_ENDED" ? "paid" : "failed", amount };
  },
};

// Webhook: X-SFPY-SIGNATURE is an HMAC-SHA512 (hex) of the JSON payload with the endpoint's shared secret.
export function verifySafepayWebhook(rawBody: string, signature: string | null): Verdict | null {
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return null;
  let payload: { type?: string; data?: { tracker?: string; amount?: number; currency?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return null;
  }
  const sign = (s: string) => createHmac("sha512", secret).update(s).digest("hex");
  const given = Buffer.from(signature);
  const ok = [rawBody, JSON.stringify(payload)].some((s) => {
    const want = Buffer.from(sign(s));
    return want.length === given.length && timingSafeEqual(want, given);
  });
  if (!ok || payload.type !== "payment.succeeded" || !payload.data?.tracker) return null;
  const { tracker, amount, currency } = payload.data;
  return { reference: tracker, status: "paid", amount: currency === "PKR" && typeof amount === "number" ? amount / 100 : undefined };
}
