import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { getDb } from "@/lib/supabase";
import { updateReturn } from "../../actions";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm";
type Row = { id: string; reason: string; status: string; admin_note: string | null; created_at: string; orders: { id: string; number: string; customer_name: string; phone: string; total: number } | null };

export default async function ReturnsAdmin() {
  const db = getDb();
  const { data } = db ? await db.from("returns").select("id, reason, status, admin_note, created_at, orders(id, number, customer_name, phone, total)").order("created_at", { ascending: false }) : { data: [] };
  const rows = (data ?? []) as unknown as Row[];
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Returns</h1>
      <p className="mb-6 max-w-2xl text-sm text-neutral-600">Flow: requested → approved (customer posts it to your return address) → received → refunded. If the issue isn&apos;t valid, set &quot;rejected&quot; or &quot;call scheduled&quot; and call the customer. Marking <strong>refunded</strong> also marks the order as returned.</p>
      {rows.length === 0 ? <p className="text-neutral-500">No return requests.</p> : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
              <p className="font-medium">{r.orders ? <Link href={`/admin/orders/${r.orders.id}`} className="underline">{r.orders.number}</Link> : "Order deleted"} · {r.orders?.customer_name} · {r.orders?.phone}</p>
              <p className="mt-2 rounded bg-neutral-50 p-2">{r.reason}</p>
              <ActionForm action={updateReturn} submitLabel="Save" className="mt-3">
                <input type="hidden" name="id" value={r.id} />
                <div className="grid gap-3 sm:grid-cols-3">
                  <label>Status
                    <select name="status" defaultValue={r.status} className={input}>{["requested", "approved", "rejected", "received", "refunded", "call_scheduled"].map((s) => <option key={s}>{s}</option>)}</select>
                  </label>
                  <label className="sm:col-span-2">Note<input name="admin_note" defaultValue={r.admin_note ?? ""} className={input} /></label>
                </div>
              </ActionForm>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
