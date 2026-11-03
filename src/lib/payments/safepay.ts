import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Provider } from "./types";

// Safepay (getsafepay.com) hosted checkout. Written from Safepay's public API as recalled,
// NOT yet run against their sandbox: test in sandbox before taking real money.
//   SAFEPAY_PUBLIC_KEY  merchant API key
//   SAFEPAY_SECRET_KEY  shared secret (verifies the signature on the customer's return)
//   SAFEPAY_ENV         "production" for live; anything else = sandbox
const prod = () => process.env.SAFEPAY_ENV === "production";
const base = () => (prod() ? "https://api.getsafepay.com" : "https://sandbox.api.getsafepay.com");

const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export const safepay: Provider = {
  id: "safepay",
  label: "Card (Visa / Mastercard) via Safepay",
  configured: () => !!process.env.SAFEPAY_PUBLIC_KEY && !!process.env.SAFEPAY_SECRET_KEY,

  async start(i) {
    const env = prod() ? "production" : "sandbox";
    const res = await fetch(`${base()}/order/v1/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client: process.env.SAFEPAY_PUBLIC_KEY, amount: i.amount, currency: "PKR", environment: env }),
    });
    const json = (await res.json().catch(() => null)) as { data?: { token?: string } } | null;
    const token = json?.data?.token;
    if (!res.ok || !token) throw new Error(`Safepay init failed (${res.status})`);
    const q = new URLSearchParams({ env, beacon: token, source: "custom", order_id: i.orderNumber, redirect_url: i.returnUrl, cancel_url: i.cancelUrl });
    return { reference: token, go: { kind: "redirect", url: `${base()}/components?${q}` } };
  },

  async parseReturn(req) {
    const q = new URL(req.url).searchParams;
    const tracker = q.get("tracker");
    const sig = q.get("sig");
    if (!tracker) return null; // cancelled
    const secret = process.env.SAFEPAY_SECRET_KEY;
    // The signature is an HMAC-SHA256 of the tracker with our shared secret. Without a valid one
    // we cannot tell a paid return from a forged URL, so a human has to confirm it.
    const ok = !!secret && !!sig && safeEq(createHmac("sha256", secret).update(tracker).digest("hex"), sig);
    return { reference: tracker, status: ok ? "paid" : "review" };
  },
};
