import Link from "next/link";
import { getDb } from "@/lib/supabase";
import { pkr } from "@/lib/site";

type Row = { id: string; number: string; status: string; customer_name: string; city: string; country: string; total: number; payment_method: string; payment_status: string; created_at: string };

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const db = getDb();
  let q = db?.from("orders").select("id, number, status, customer_name, city, country, total, payment_method, payment_status, created_at").order("created_at", { ascending: false }).limit(200);
  if (q && status) q = q.eq("status", status);
  const { data } = q ? await q : { data: [] };
  const rows = (data ?? []) as Row[];
  const tabs = ["", "pending", "paid", "packed", "shipped", "delivered", "cancelled", "returned"];

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {tabs.map((t) => (
          <Link key={t} href={t ? `/admin/orders?status=${t}` : "/admin/orders"} className={`rounded-full border px-3 py-1 ${(status ?? "") === t ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300"}`}>{t || "All"}</Link>
        ))}
      </div>
      {rows.length === 0 ? <p className="text-neutral-500">No orders.</p> : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500"><tr><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Ship to</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Status</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-neutral-100">
                  <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium hover:underline">{o.number}</Link><br /><span className="text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString("en-GB")}</span></td>
                  <td className="p-3">{o.customer_name}</td>
                  <td className="p-3">{o.city}, {o.country}</td>
                  <td className="p-3">{pkr(o.total)}</td>
                  <td className="p-3 text-xs">{o.payment_method} · {o.payment_status}</td>
                  <td className="p-3">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
