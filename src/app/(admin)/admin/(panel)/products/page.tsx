import Link from "next/link";
import ActionForm from "@/components/admin/ActionForm";
import { importSample } from "../../actions";
import { getDb } from "@/lib/supabase";
import { pkr } from "@/lib/site";

type Row = {
  id: string;
  name: string;
  sell_price: number;
  buy_price: number;
  in_stock: boolean;
  active: boolean;
  images: string[];
  brands: { name: string } | null;
};

export default async function ProductsAdmin() {
  const db = getDb();
  const { data } = db
    ? await db.from("products").select("id, name, sell_price, buy_price, in_stock, active, images, brands(name)").order("created_at", { ascending: false })
    : { data: [] };
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/new" className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Add product</Link>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6">
          <p className="text-neutral-600">No products yet. Add a brand first, then a product.</p>
          <p className="mt-4 text-sm text-neutral-600">Just want to try the whole shop (cart, checkout, orders)? Import sample brands and dresses with placeholder pictures. You can delete them later.</p>
          <ActionForm action={importSample} submitLabel="Import sample catalog" className="mt-2"><span /></ActionForm>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
              <tr><th className="p-3">Product</th><th className="p-3">Brand</th><th className="p-3">Buy</th><th className="p-3">Sell</th><th className="p-3">Margin</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-neutral-100">
                  <td className="p-3">
                    <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {r.images[0] ? <img src={r.images[0]} alt="" className="h-12 w-9 rounded object-cover" /> : <span className="h-12 w-9 rounded bg-neutral-100" />}
                      {r.name}
                    </Link>
                  </td>
                  <td className="p-3">{r.brands?.name}</td>
                  <td className="p-3">{pkr(r.buy_price)}</td>
                  <td className="p-3">{pkr(r.sell_price)}</td>
                  <td className="p-3">{pkr(r.sell_price - r.buy_price)}</td>
                  <td className="p-3 text-xs">{!r.active ? "Hidden" : !r.in_stock ? "Out of stock" : "Live"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
