import ActionForm from "@/components/admin/ActionForm";
import { getDb } from "@/lib/supabase";
import { createBrand, deleteBrand, updateBrand } from "../../actions";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm";

type Row = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort: number;
  active: boolean;
  in_stock: boolean;
};

function Fields({ b }: { b?: Row }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">
        Name
        <input name="name" defaultValue={b?.name} required className={input} />
      </label>
      <label className="text-sm">
        URL slug <span className="text-neutral-400">(blank = from name)</span>
        <input name="slug" defaultValue={b?.slug} className={input} />
      </label>
      <label className="text-sm sm:col-span-2">
        Description
        <textarea name="description" defaultValue={b?.description} rows={2} className={input} />
      </label>
      <label className="text-sm">
        Sort order
        <input name="sort" type="number" defaultValue={b?.sort ?? 0} className={input} />
      </label>
      <div className="flex items-end gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input name="active" type="checkbox" defaultChecked={b?.active ?? true} /> Visible on site
        </label>
        <label className="flex items-center gap-2">
          <input name="in_stock" type="checkbox" defaultChecked={b?.in_stock ?? true} /> In stock
        </label>
      </div>
    </div>
  );
}

export default async function BrandsAdmin() {
  const db = getDb();
  const { data } = db
    ? await db.from("brands").select("id, name, slug, description, sort, active, in_stock").order("sort").order("name")
    : { data: [] };
  const brands = (data ?? []) as Row[];

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Brands</h1>

      <section className="mb-10 rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Add a brand</h2>
        <ActionForm action={createBrand} submitLabel="Add brand">
          <Fields />
        </ActionForm>
      </section>

      <div className="space-y-4">
        {brands.length === 0 && <p className="text-neutral-500">No brands yet.</p>}
        {brands.map((b) => (
          <details key={b.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-medium">
              {b.name}
              {!b.active && <span className="ml-2 text-neutral-400">(hidden)</span>}
              {!b.in_stock && <span className="ml-2 text-neutral-400">(out of stock)</span>}
            </summary>
            <div className="mt-4">
              <ActionForm action={updateBrand} submitLabel="Save">
                <input type="hidden" name="id" value={b.id} />
                <Fields b={b} />
              </ActionForm>
              <ActionForm
                action={deleteBrand}
                submitLabel="Delete brand"
                danger
                confirm={`Delete "${b.name}" AND all its products? This cannot be undone.`}
                className="mt-4 border-t border-neutral-100 pt-4"
              >
                <input type="hidden" name="id" value={b.id} />
              </ActionForm>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
