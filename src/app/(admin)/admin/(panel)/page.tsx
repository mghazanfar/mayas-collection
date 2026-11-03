import { getDb } from "@/lib/supabase";

async function count(table: string): Promise<number | null> {
  const db = getDb();
  if (!db) return null;
  const { count: n, error } = await db.from(table).select("id", { count: "exact", head: true });
  return error ? null : (n ?? 0);
}

export default async function Dashboard() {
  const [brands, products, orders] = await Promise.all([count("brands"), count("products"), count("orders")]);
  const stat = (label: string, v: number | null) => (
    <div className="rounded-lg border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{v ?? "–"}</p>
    </div>
  );
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>
      {getDb() ? null : (
        <p className="mb-4 rounded bg-amber-100 p-3 text-sm text-amber-900">
          Database not connected: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {stat("Brands", brands)}
        {stat("Products", products)}
        {stat("Orders", orders)}
      </div>
      <p className="mt-6 text-sm text-neutral-500">Profit report, products and orders arrive in the next steps.</p>
    </>
  );
}
