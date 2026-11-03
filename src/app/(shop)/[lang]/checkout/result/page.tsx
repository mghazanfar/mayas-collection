import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClearCartWhenPaid from "@/components/ClearCartWhenPaid";
import { href, isLang } from "@/lib/i18n";
import { getDb } from "@/lib/supabase";

export const metadata: Metadata = { title: "Payment", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PaymentResult({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const { order } = await searchParams;
  const number = String(order ?? "").slice(0, 40);
  const { data } = number ? await getDb()?.from("orders").select("number, payment_status").eq("number", number).maybeSingle() ?? { data: null } : { data: null };
  const st = data?.payment_status as string | undefined;

  const view =
    st === "paid"
      ? { tone: "border-green-200 bg-green-50 text-green-900", title: "Payment received. Thank you!", body: "Your order is confirmed and a confirmation email is on its way." }
      : st === "review"
        ? { tone: "border-amber-200 bg-amber-50 text-amber-900", title: "We're confirming your payment", body: "Your payment came back but we need to confirm it with the payment provider. We will email you shortly. Please don't pay again." }
        : { tone: "border-red-200 bg-red-50 text-red-900", title: "Payment was not completed", body: "No money was taken for this order. You can go back to checkout and try again or choose another payment method." };

  return (
    <div className={`mx-auto max-w-xl rounded-lg border p-6 ${view.tone}`}>
      {st === "paid" && <ClearCartWhenPaid />}
      <h1 className="text-xl font-bold">{view.title}</h1>
      {data && <p className="mt-2 text-sm">Order number: <strong>{data.number}</strong></p>}
      <p className="mt-2 text-sm">{view.body}</p>
      <div className="mt-5 flex gap-3">
        <Link href={href(lang, "/track")} className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">Track order</Link>
        {st !== "paid" && <Link href={href(lang, "/checkout")} className="rounded border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-900">Back to checkout</Link>}
      </div>
    </div>
  );
}
