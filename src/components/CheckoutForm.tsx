"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { getQuote, placeOrder, type PlaceResult, type Quote } from "@/app/actions/shop";
import { useCart } from "@/lib/cart";
import { href, type Lang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";
import { COUNTRIES, orderTotals, type PaymentMethod } from "@/lib/shipping";
import { pkr } from "@/lib/site";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm";
const PAY_LABEL: Record<PaymentMethod, string> = {
  cod: "Cash on delivery (Pakistan only)",
  bank_transfer: "Bank transfer (we send details after you order)",
  card: "Card / JazzCash / EasyPaisa (coming soon)",
};
const CITIES = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Sialkot", "Gujranwala", "Hyderabad", "Bahawalpur"];

export default function CheckoutForm({ lang }: { lang: Lang }) {
  const d = ts[lang];
  const cart = useCart();
  const [f, setF] = useState({ name: "", email: "", phone: "", country: "Pakistan", city: "", address: "", postal: "", note: "" });
  const [courier, setCourier] = useState("");
  const [payment, setPayment] = useState<PaymentMethod | "">("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<(PlaceResult & { ok: true }) | null>(null);
  const [pending, start] = useTransition();
  const seq = useRef(0);

  const items = useMemo(() => cart.lines.map((l) => ({ productId: l.productId, size: l.size, color: l.color, qty: l.qty })), [cart.lines]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((cur) => ({ ...cur, [k]: e.target.value }));

  // Re-quote delivery whenever the destination or cart changes (debounced). The server
  // does the pricing; the browser only displays it.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!cart.ready || items.length === 0 || f.city.trim().length < 2) {
      setQuote(null);
      return;
    }
    const mine = ++seq.current;
    setQuoting(true);
    const t = setTimeout(async () => {
      const q = await getQuote(items, f.country, f.city);
      if (mine !== seq.current) return;
      setQuote(q);
      setQuoting(false);
      if (!("error" in q)) {
        setCourier((c) => (q.options.some((o) => o.courier === c) ? c : (q.options[0]?.courier ?? "")));
        setPayment((p) => (p && q.payments.includes(p) ? p : (q.payments.find((x) => x !== "card") ?? "")));
      }
    }, 400);
    return () => clearTimeout(t);
  }, [items, f.country, f.city, cart.ready]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const q = quote && !("error" in quote) ? quote : null;
  const opt = q?.options.find((o) => o.courier === courier);
  const totals = q && opt && payment ? orderTotals(q.subtotal, opt.fee, payment, { ...q.fees, lahore_handling: 0, other_city_handling: 0, international_handling: 0 }) : null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!opt || !payment) return setError("Please choose a delivery and payment option.");
    start(async () => {
      const res = await placeOrder({ items, ...f, courier, payment });
      if (!res.ok) return setError(res.error);
      if (!res.demo) cart.clear();
      setDone(res);
    });
  }

  if (!cart.ready) return <p className="py-16 text-center text-neutral-400">…</p>;

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-green-200 bg-green-50 p-6">
        <h2 className="text-xl font-bold text-green-900">{done.demo ? "Demo order (not saved)" : "Thank you! Your order is placed."}</h2>
        <p className="mt-2">Order number: <strong>{done.number}</strong></p>
        <p>Total: <strong>{pkr(done.total)}</strong>. Estimated delivery: {done.eta}.</p>
        {done.demo && <p className="mt-2 text-sm text-amber-900">{d.demoOrderNote}</p>}
        {!done.demo && done.payment === "bank_transfer" && (
          <div className="mt-4 rounded bg-white p-3 text-sm">
            <p className="font-semibold">Please pay by bank transfer:</p>
            <p className="mt-1 whitespace-pre-line">{done.bankDetails || "We will send you the bank details on WhatsApp shortly."}</p>
            <p className="mt-2 text-neutral-500">Use {done.number} as the payment reference. We dispatch after the payment arrives.</p>
          </div>
        )}
        {!done.demo && done.payment === "cod" && <p className="mt-3 text-sm">Pay in cash when the courier delivers.</p>}
        {!done.demo && <p className="mt-3 text-sm text-neutral-600">A confirmation was sent to your email. You can follow your order on the Track order page with this number and your email.</p>}
        <div className="mt-5 flex gap-3">
          <Link href={href(lang, "/track")} className="rounded bg-neutral-900 px-4 py-2 text-sm text-white">Track order</Link>
          <Link href={href(lang, "/shop")} className="rounded border border-neutral-300 px-4 py-2 text-sm">{d.continueShopping}</Link>
        </div>
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-600">{d.emptyCart}</p>
        <Link href={href(lang, "/shop")} className="mt-4 inline-block rounded bg-neutral-900 px-6 py-3 text-sm font-semibold text-white">{d.continueShopping}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 md:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <section>
          <h2 className="mb-3 font-semibold">Contact & delivery address</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm sm:col-span-2">Full name<input required autoComplete="name" value={f.name} onChange={set("name")} className={input} /></label>
            <label className="text-sm">Email<input required type="email" autoComplete="email" value={f.email} onChange={set("email")} className={input} /></label>
            <label className="text-sm">Phone / WhatsApp<input required type="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder={f.country === "Pakistan" ? "03001234567" : "+971501234567"} className={input} /></label>
            <label className="text-sm">Country
              <select value={f.country} onChange={set("country")} autoComplete="country-name" className={input}>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="text-sm">City
              <input required list="cities" autoComplete="address-level2" value={f.city} onChange={set("city")} className={input} />
              {f.country === "Pakistan" && <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>}
            </label>
            <label className="text-sm sm:col-span-2">Full address<textarea required rows={2} autoComplete="street-address" value={f.address} onChange={set("address")} className={input} /></label>
            <label className="text-sm">Postal code <span className="text-neutral-400">(optional)</span><input autoComplete="postal-code" value={f.postal} onChange={set("postal")} className={input} /></label>
            <label className="text-sm sm:col-span-2">Note for us <span className="text-neutral-400">(optional)</span><textarea rows={2} maxLength={300} value={f.note} onChange={set("note")} className={input} /></label>
          </div>
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Delivery</h2>
          {f.city.trim().length < 2 ? <p className="text-sm text-neutral-500">Enter your city to see delivery options.</p>
            : quoting ? <p className="text-sm text-neutral-500">Calculating…</p>
            : quote && "error" in quote ? <p role="alert" className="text-sm text-red-600">{quote.error}</p>
            : q && q.options.length === 0 ? <p role="alert" className="text-sm text-red-600">Delivery to this address isn&apos;t available online yet. Please contact us on WhatsApp to arrange your order.</p>
            : q ? (
              <ul className="space-y-2">
                {q.options.map((o) => (
                  <li key={o.courier}>
                    <label className={`flex cursor-pointer items-center justify-between rounded border p-3 text-sm ${courier === o.courier ? "border-neutral-900" : "border-neutral-300"}`}>
                      <span className="flex items-center gap-3">
                        <input type="radio" name="courier" checked={courier === o.courier} onChange={() => setCourier(o.courier)} />
                        <span><strong>{o.label}</strong><br /><span className="text-neutral-500">Estimated {o.etaMin}–{o.etaMax} working days</span></span>
                      </span>
                      <span className="font-medium">{pkr(o.fee)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
        </section>

        {q && q.options.length > 0 && (
          <section>
            <h2 className="mb-3 font-semibold">Payment</h2>
            <ul className="space-y-2">
              {q.payments.map((m) => (
                <li key={m}>
                  <label className={`flex items-center gap-3 rounded border p-3 text-sm ${m === "card" ? "cursor-not-allowed opacity-50" : "cursor-pointer"} ${payment === m ? "border-neutral-900" : "border-neutral-300"}`}>
                    <input type="radio" name="payment" disabled={m === "card"} checked={payment === m} onChange={() => setPayment(m)} />
                    {PAY_LABEL[m]}
                    {m === "cod" && q.fees.cod_fee > 0 && <span className="ms-auto text-neutral-500">+ {pkr(q.fees.cod_fee)}</span>}
                  </label>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="h-fit space-y-3 rounded-lg border border-neutral-200 p-5 text-sm">
        <h2 className="font-semibold">Order summary</h2>
        <ul className="divide-y divide-neutral-100">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-3 py-2">
              <span>{l.qty} × {l.name}<span className="block text-xs text-neutral-500">{[l.size, l.color].filter(Boolean).join(" · ")}</span></span>
              <span>{pkr(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between"><span>{d.subtotal}</span><span>{pkr(cart.subtotal)}</span></p>
        <p className="flex justify-between"><span>Delivery</span><span>{opt ? pkr(opt.fee) : "–"}</span></p>
        {totals && totals.codFee > 0 && <p className="flex justify-between"><span>Cash on delivery fee</span><span>{pkr(totals.codFee)}</span></p>}
        <p className="flex justify-between border-t border-neutral-200 pt-3 text-base font-semibold"><span>Total</span><span>{totals ? pkr(totals.total) : "–"}</span></p>
        {q?.demo && <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">{d.demoOrderNote}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending || !totals} className="w-full rounded bg-neutral-900 py-3 font-semibold uppercase text-white hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-300">
          {pending ? "…" : "Place order"}
        </button>
        <p className="text-xs text-neutral-500">By ordering you agree to our <Link href={href(lang, "/policies/terms")} className="underline">terms</Link> and <Link href={href(lang, "/policies/returns")} className="underline">return policy</Link>.</p>
      </aside>
    </form>
  );
}
