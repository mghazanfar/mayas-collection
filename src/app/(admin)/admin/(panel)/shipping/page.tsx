import ActionForm from "@/components/admin/ActionForm";
import { getDb } from "@/lib/supabase";
import { createRate, deleteRate, loadExampleRates, updateRate } from "../../actions";

const input = "mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm";
type Row = { id: string; courier: string; zone: string; up_to_g: number; price: number; eta_min_days: number; eta_max_days: number; active: boolean; verified: boolean; service: string };

function Fields({ r }: { r?: Row }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
      <label className="text-xs">Courier
        <select name="courier" defaultValue={r?.courier ?? "pakpost"} className={input}><option value="pakpost">Pakistan Post</option><option value="tcs">TCS</option><option value="leopard">Leopards</option></select>
      </label>
      <label className="text-xs">Zone
        <select name="zone" defaultValue={r?.zone ?? "pakistan"} className={input}><option value="lahore">Lahore</option><option value="pakistan">Rest of Pakistan</option><option value="international">International</option></select>
      </label>
      <label className="text-xs">Up to (grams)<input name="up_to_g" type="number" min={1} defaultValue={r?.up_to_g ?? 1000} className={input} /></label>
      <label className="text-xs">Courier price (PKR)<input name="price" type="number" min={0} defaultValue={r?.price ?? ""} required className={input} /></label>
      <label className="text-xs">Days min<input name="eta_min_days" type="number" min={1} defaultValue={r?.eta_min_days ?? 3} className={input} /></label>
      <label className="text-xs">Days max<input name="eta_max_days" type="number" min={1} defaultValue={r?.eta_max_days ?? 7} className={input} /></label>
      <label className="text-xs">Service name<input name="service" defaultValue={r?.service} placeholder="optional" className={input} /></label>
      <div className="flex flex-col justify-end gap-1 text-xs">
        <label className="flex items-center gap-1"><input type="checkbox" name="active" defaultChecked={r?.active ?? true} /> Active</label>
        <label className="flex items-center gap-1"><input type="checkbox" name="verified" defaultChecked={r?.verified ?? false} /> Verified</label>
      </div>
    </div>
  );
}

export default async function ShippingAdmin() {
  const db = getDb();
  const { data } = db ? await db.from("shipping_rates").select("*").order("zone").order("courier").order("up_to_g") : { data: [] };
  const rows = (data ?? []) as Row[];
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Shipping rates</h1>
      <p className="mb-6 max-w-3xl text-sm text-neutral-600">
        Enter each courier&apos;s own price for a weight band (from their price list or rate calculator, Lahore as origin). Customers pay <strong>courier price + handling</strong>
        (handling is set in Settings: Lahore / other city / international). The shop picks the smallest band that fits the parcel. <strong>Only rows ticked &quot;Verified&quot; are used for real orders.</strong>
        A parcel heavier than your largest band gets no online delivery option for that courier.
      </p>

      <section className="mb-8 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Add a rate</h2>
        <ActionForm action={createRate} submitLabel="Add rate"><Fields /></ActionForm>
      </section>

      {rows.length === 0 && (
        <div className="mb-6 rounded-lg border border-dashed border-neutral-300 bg-white p-5 text-sm">
          <p>No rates yet. You can load example rows to edit (they are made-up numbers, unverified, and will not be offered to customers until you correct and verify them).</p>
          <ActionForm action={loadExampleRates} submitLabel="Load example rates" className="mt-2"><span /></ActionForm>
        </div>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <details key={r.id} className={`rounded-lg border bg-white p-4 ${r.verified ? "border-neutral-200" : "border-amber-300"}`}>
            <summary className="cursor-pointer text-sm">
              <strong>{r.courier}</strong> · {r.zone} · up to {r.up_to_g} g · PKR {r.price} · {r.eta_min_days}–{r.eta_max_days} days
              {!r.verified && <span className="ms-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">not verified</span>}
              {!r.active && <span className="ms-2 text-xs text-neutral-400">inactive</span>}
            </summary>
            <div className="mt-3">
              <ActionForm action={updateRate} submitLabel="Save"><input type="hidden" name="id" value={r.id} /><Fields r={r} /></ActionForm>
              <ActionForm action={deleteRate} submitLabel="Delete" danger confirm="Delete this rate?" className="mt-3"><input type="hidden" name="id" value={r.id} /></ActionForm>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
