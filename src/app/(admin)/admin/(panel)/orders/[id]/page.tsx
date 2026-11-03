import { notFound } from "next/navigation";
import ActionForm from "@/components/admin/ActionForm";
import { COURIER_LABEL, type Courier } from "@/lib/shipping";
import { getDb } from "@/lib/supabase";
import { pkr } from "@/lib/site";
import { updateOrder } from "../../../actions";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: o } = await db.from("orders").select("*, order_items(*), returns(status, reason)").eq("id", id).maybeSingle();
  if (!o) notFound();
  const items = o.order_items as { id: string; name: string; size: string | null; color: string | null; qty: number; sell_price: number; buy_price: number }[];
  const profit = items.reduce((n, i) => n + (i.sell_price - i.buy_price) * i.qty, 0);
  const wa = String(o.phone).replace(/\D/g, "");

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold">Order {o.number}</h1>
      <p className="mb-6 text-sm text-neutral-500">{new Date(o.created_at).toLocaleString("en-GB")} · {o.payment_method} · {o.courier ? COURIER_LABEL[o.courier as Courier] : ""}</p>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Customer</h2>
          <p>{o.customer_name}</p>
          <p><a className="underline" href={`mailto:${o.email}`}>{o.email}</a></p>
          <p><a className="underline" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">{o.phone}</a> (WhatsApp)</p>
          <p className="mt-2 whitespace-pre-line">{o.address}{"\n"}{o.city} {o.postal_code ?? ""}{"\n"}{o.country}</p>
          {o.customer_note && <p className="mt-2 rounded bg-amber-50 p-2">Customer note: {o.customer_note}</p>}
        </section>
        <section className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
          <h2 className="mb-2 font-semibold">Items</h2>
          <ul className="divide-y divide-neutral-100">
            {items.map((i) => <li key={i.id} className="flex justify-between py-1.5"><span>{i.qty} × {i.name} <span className="text-neutral-500">{[i.size, i.color].filter(Boolean).join(" · ")}</span></span><span>{pkr(i.sell_price * i.qty)}</span></li>)}
          </ul>
          <p className="mt-2 flex justify-between"><span>Delivery charged</span><span>{pkr(o.shipping_fee)}</span></p>
          {o.cod_fee > 0 && <p className="flex justify-between"><span>COD fee</span><span>{pkr(o.cod_fee)}</span></p>}
          {o.gateway_fee > 0 && <p className="flex justify-between"><span>Gateway fee</span><span>{pkr(o.gateway_fee)}</span></p>}
          <p className="flex justify-between border-t border-neutral-200 pt-2 font-semibold"><span>Total</span><span>{pkr(o.total)}</span></p>
          <p className="mt-2 text-xs text-neutral-500">Item margin (before courier cost): {pkr(profit)} · Parcel weight {o.weight_g} g</p>
        </section>
      </div>
      {(o.returns as { status: string; reason: string }[]).map((r, i) => <p key={i} className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-900">Return {r.status}: {r.reason}</p>)}

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Update order</h2>
        <ActionForm action={updateOrder} submitLabel="Save">
          <input type="hidden" name="id" value={o.id} />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm">Status
              <select name="status" defaultValue={o.status} className={input}>{["pending", "paid", "packed", "shipped", "delivered", "cancelled", "returned"].map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className="text-sm">Payment
              <select name="payment_status" defaultValue={o.payment_status} className={input}>{["unpaid", "awaiting_payment", "review", "failed", "paid", "refunded"].map((s) => <option key={s}>{s}</option>)}</select>
            </label>
            <label className="text-sm">Tracking number<input name="tracking_no" defaultValue={o.tracking_no ?? ""} className={input} /></label>
            <label className="text-sm">What the courier actually charged us (PKR)<input name="shipping_cost" type="number" min={0} defaultValue={o.shipping_cost ?? ""} className={input} /></label>
            <label className="text-sm sm:col-span-2">Internal note<input name="admin_note" defaultValue={o.admin_note} className={input} /></label>
          </div>
        </ActionForm>
      </section>
    </>
  );
}
