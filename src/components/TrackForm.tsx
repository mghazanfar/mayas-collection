"use client";

import { useState, useTransition } from "react";
import { requestReturn, trackOrder, type TrackResult } from "@/app/actions/shop";
import { pkr } from "@/lib/site";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm";
const STEPS = ["pending", "paid", "packed", "shipped", "delivered"];
const LABEL: Record<string, string> = { pending: "Order received", paid: "Payment received", packed: "Packed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", returned: "Returned" };

// mode "track": look up an order. mode "return": look it up, then request a return.
export default function TrackForm({ mode, returnAddress }: { mode: "track" | "return"; returnAddress?: string }) {
  const [number, setNumber] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [res, setRes] = useState<TrackResult | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    start(async () => setRes(await trackOrder(number, email)));
  };

  const submitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await requestReturn(number, email, reason);
      setMsg(r.ok ? { ok: true, text: "Your return request was received. We will review it and contact you." } : { ok: false, text: r.error });
      if (r.ok) setRes(await trackOrder(number, email));
    });
  };

  const order = res && !("error" in res) ? res : null;

  return (
    <div className="max-w-2xl">
      <form onSubmit={lookup} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">Order number<input required value={number} onChange={(e) => setNumber(e.target.value)} placeholder="MC-260101-ABCDE" className={input} /></label>
        <label className="text-sm">Email used for the order<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} /></label>
        <button disabled={pending} className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white sm:col-span-2 sm:w-fit">{pending ? "…" : "Find my order"}</button>
      </form>
      {res && "error" in res && <p role="alert" className="mt-3 text-sm text-red-600">{res.error}</p>}

      {order && (
        <div className="mt-6 rounded-lg border border-neutral-200 p-5 text-sm">
          <p className="font-semibold">Order {order.number}</p>
          <p className="mt-1 text-neutral-600">Status: <strong>{LABEL[order.status] ?? order.status}</strong>{order.status === "shipped" && order.trackingNo ? ` · ${order.courier} tracking no. ${order.trackingNo}` : ""}</p>
          {STEPS.includes(order.status) && (
            <ol className="mt-3 flex gap-1">
              {STEPS.map((s, i) => <li key={s} className={`h-1.5 flex-1 rounded ${i <= STEPS.indexOf(order.status) ? "bg-green-600" : "bg-neutral-200"}`} title={LABEL[s]} />)}
            </ol>
          )}
          {order.eta && <p className="mt-2 text-neutral-500">Estimated delivery: {order.eta} from dispatch.</p>}
          <ul className="mt-4 divide-y divide-neutral-100">
            {order.items.map((i, k) => <li key={k} className="flex justify-between py-1.5"><span>{i.qty} × {i.name} <span className="text-neutral-500">{[i.size, i.color].filter(Boolean).join(" · ")}</span></span><span>{pkr(i.price * i.qty)}</span></li>)}
          </ul>
          <p className="mt-3 flex justify-between"><span>Delivery</span><span>{pkr(order.shipping)}</span></p>
          {order.fees > 0 && <p className="flex justify-between"><span>Payment fees</span><span>{pkr(order.fees)}</span></p>}
          <p className="flex justify-between font-semibold"><span>Total</span><span>{pkr(order.total)}</span></p>
          {order.returnStatus && <p className="mt-3 rounded bg-amber-50 p-2 text-amber-900">Return request status: <strong>{order.returnStatus.replace("_", " ")}</strong></p>}

          {mode === "return" && !order.returnStatus && ["shipped", "delivered"].includes(order.status) && (
            <form onSubmit={submitReturn} className="mt-5 border-t border-neutral-200 pt-4">
              <label className="text-sm">What is wrong with your order?
                <textarea required minLength={10} maxLength={1000} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={input} />
              </label>
              <button disabled={pending} className="mt-3 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Request return</button>
              {returnAddress && <p className="mt-3 text-xs text-neutral-500">After requesting, post the item to: <span className="whitespace-pre-line font-medium text-neutral-700">{returnAddress}</span></p>}
            </form>
          )}
          {mode === "return" && !order.returnStatus && !["shipped", "delivered"].includes(order.status) && <p className="mt-4 text-neutral-500">Returns can be requested once your order has shipped.</p>}
        </div>
      )}
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-3 text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
    </div>
  );
}
