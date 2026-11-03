import { NextResponse } from "next/server";
import { settlePayment } from "@/lib/payments";
import { verifySafepayWebhook } from "@/lib/payments/safepay";

// Safepay calls this when a payment is captured, even if the customer closed the tab before returning.
// Set the endpoint to  <site>/api/pay/safepay/webhook  in the Safepay dashboard (Developers > Endpoints).
export async function POST(req: Request) {
  const raw = await req.text();
  const verdict = verifySafepayWebhook(raw, req.headers.get("x-sfpy-signature"));
  // Always answer 200 for events we ignore so Safepay doesn't keep retrying them.
  if (!verdict) return NextResponse.json({ ok: false }, { status: process.env.SAFEPAY_WEBHOOK_SECRET ? 200 : 503 });
  await settlePayment("safepay", verdict).catch((e) => console.error("[pay] webhook settle failed", e));
  return NextResponse.json({ ok: true });
}
