import Link from "next/link";
import { profitReport, type ProfitSummary } from "@/lib/profit";
import { pkr } from "@/lib/site";
import { getDb } from "@/lib/supabase";

async function count(table: string, filter?: [string, string]): Promise<number | null> {
  const db = getDb();
  if (!db) return null;
  let q = db.from(table).select("id", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count: n, error } = await q;
  return error ? null : (n ?? 0);
}

function Report({ title, s }: { title: string; s: ProfitSummary }) {
  const row = (label: string, v: number, sign = "") => (
    <tr className="border-t border-neutral-100"><td className="py-1.5">{label}</td><td className="py-1.5 text-right">{sign}{pkr(v)}</td></tr>
  );
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-neutral-500">{s.orders} delivered order{s.orders === 1 ? "" : "s"}</p>
      <table className="mt-2 w-full text-sm">
        <tbody>
          {row("Sold for (dresses)", s.itemsRevenue)}
          {row("What we paid for them", s.itemsCost, "− ")}
          {row("Delivery charged to customers", s.shippingCharged, "+ ")}
          {row("Courier charged us", s.shippingPaid, "− ")}
          {row("COD fees collected", s.codFees, "+ ")}
          {row("Payment gateway fees", s.gatewayFees, "− ")}
          <tr className="border-t-2 border-neutral-300 font-semibold"><td className="py-2">Profit</td><td className={`py-2 text-right ${s.profit < 0 ? "text-red-600" : "text-green-700"}`}>{pkr(s.profit)}</td></tr>
        </tbody>
      </table>
      {s.missingShippingCost > 0 && <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-900">{s.missingShippingCost} delivered order(s) have no courier cost entered, so profit is overstated. Open the order and fill in what the courier charged.</p>}
    </div>
  );
}

export default async function Dashboard() {
  const db = getDb();
  const [brands, products, orders, pending, openReturns, report, unverified] = await Promise.all([
    count("brands"), count("products"), count("orders"), count("orders", ["status", "pending"]), count("returns", ["status", "requested"]),
    profitReport(),
    db ? db.from("shipping_rates").select("id", { count: "exact", head: true }).eq("verified", false).eq("active", true).then((r) => r.count ?? 0) : Promise.resolve(0),
  ]);
  const stat = (label: string, v: number | null, to?: string) => (
    <Link href={to ?? "#"} className="rounded-lg border border-neutral-200 bg-white p-5 hover:bg-neutral-50">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{v ?? "–"}</p>
    </Link>
  );
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      {db ? null : <p className="mb-4 rounded bg-amber-100 p-3 text-sm text-amber-900">Database not connected: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.</p>}
      {unverified > 0 && <p className="mb-4 rounded bg-amber-100 p-3 text-sm text-amber-900">{unverified} shipping rate(s) are not verified. Customers won&apos;t get delivery options for real orders until you <Link href="/admin/shipping" className="underline">enter real courier prices and tick Verified</Link>.</p>}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stat("Brands", brands, "/admin/brands")}
        {stat("Products", products, "/admin/products")}
        {stat("Orders", orders, "/admin/orders")}
        {stat("Pending orders", pending, "/admin/orders?status=pending")}
        {stat("Open returns", openReturns, "/admin/returns")}
      </div>
      <h2 className="mb-3 mt-10 text-xl font-bold">Profit (delivered orders only)</h2>
      {report ? (
        <div className="grid gap-4 md:grid-cols-2"><Report title="Last 30 days" s={report.last30} /><Report title="All time" s={report.all} /></div>
      ) : <p className="text-neutral-500">Connect the database to see profit.</p>}
    </>
  );
}
