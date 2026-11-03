import ActionForm from "./ActionForm";
import ImageUploader from "./ImageUploader";
import type { Result } from "@/app/(admin)/admin/actions";

const input = "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm";

export type ProductRow = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string;
  details: string;
  fabric: string;
  model_info: string;
  images: string[];
  sell_price: number;
  buy_price: number;
  compare_price: number | null;
  weight_g: number;
  kind: string;
  sizes: string[];
  sold_out_sizes: string[];
  colors: string[];
  color_images: Record<string, number>;
  in_stock: boolean;
  active: boolean;
};

export default function ProductForm({
  action,
  brands,
  p,
  submitLabel,
}: {
  action: (prev: Result, fd: FormData) => Promise<Result>;
  brands: { id: string; name: string }[];
  p?: ProductRow;
  submitLabel: string;
}) {
  const colorImages = Object.entries(p?.color_images ?? {}).map(([c, i]) => `${c}: ${i + 1}`).join("\n");
  return (
    <ActionForm action={action} submitLabel={submitLabel} className="space-y-6">
      {p && <input type="hidden" name="id" value={p.id} />}

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Basics</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Brand
            <select name="brand_id" defaultValue={p?.brand_id ?? ""} required className={input}>
              <option value="" disabled>Choose…</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Type
            <select name="kind" defaultValue={p?.kind ?? "stitched"} className={input}>
              <option value="stitched">Stitched (can have sizes and colours)</option>
              <option value="unstitched">Unstitched (no size or colour)</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">Name
            <input name="name" defaultValue={p?.name} required className={input} />
          </label>
          <label className="text-sm">URL slug <span className="text-neutral-400">(blank = from name)</span>
            <input name="slug" defaultValue={p?.slug} className={input} />
          </label>
          <label className="text-sm">Fabric
            <input name="fabric" defaultValue={p?.fabric} placeholder="Lawn, chiffon, khaddar…" className={input} />
          </label>
          <label className="text-sm sm:col-span-2">Description
            <textarea name="description" defaultValue={p?.description} rows={4} className={input} />
          </label>
          <label className="text-sm sm:col-span-2">Details & composition <span className="text-neutral-400">(one point per line)</span>
            <textarea name="details" defaultValue={p?.details} rows={3} className={input} />
          </label>
          <label className="text-sm sm:col-span-2">Model info <span className="text-neutral-400">(e.g. Model is wearing size M)</span>
            <input name="model_info" defaultValue={p?.model_info} className={input} />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Pricing (PKR)</h2>
        <p className="mb-3 text-xs text-neutral-500">Buying price is private: it is only used for the profit report and is never shown to customers.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-sm">Buying price (our cost)
            <input name="buy_price" type="number" min={0} defaultValue={p?.buy_price ?? ""} required className={input} />
          </label>
          <label className="text-sm">Selling price (shown)
            <input name="sell_price" type="number" min={1} defaultValue={p?.sell_price ?? ""} required className={input} />
          </label>
          <label className="text-sm">Original price <span className="text-neutral-400">(for sale)</span>
            <input name="compare_price" type="number" min={0} defaultValue={p?.compare_price ?? ""} className={input} />
          </label>
          <label className="text-sm">Weight (grams)
            <input name="weight_g" type="number" min={50} max={20000} defaultValue={p?.weight_g ?? 1000} required className={input} />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-1 font-semibold">Sizes & colours</h2>
        <p className="mb-3 text-xs text-neutral-500">Ignored for unstitched dresses. Leave empty if the product has no sizes or colours.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Sizes <span className="text-neutral-400">(comma separated)</span>
            <input name="sizes" defaultValue={p?.sizes.join(", ")} placeholder="S, M, L, XL" className={input} />
          </label>
          <label className="text-sm">Sold-out sizes <span className="text-neutral-400">(shown but disabled)</span>
            <input name="sold_out_sizes" defaultValue={p?.sold_out_sizes.join(", ")} placeholder="XL" className={input} />
          </label>
          <label className="text-sm">Colours <span className="text-neutral-400">(Name|#hex, comma separated)</span>
            <input name="colors" defaultValue={p?.colors.join(", ")} placeholder="Mint|#8fd3b6, Peach|#f6b49a" className={input} />
          </label>
          <label className="text-sm">Colour → photo number <span className="text-neutral-400">(one per line)</span>
            <textarea name="color_images" defaultValue={colorImages} rows={2} placeholder={"Mint: 1\nPeach: 4"} className={input} />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Photos</h2>
        <ImageUploader initial={p?.images ?? []} />
      </section>

      <section className="flex gap-6 rounded-lg border border-neutral-200 bg-white p-5 text-sm">
        <label className="flex items-center gap-2"><input name="in_stock" type="checkbox" defaultChecked={p?.in_stock ?? true} /> In stock</label>
        <label className="flex items-center gap-2"><input name="active" type="checkbox" defaultChecked={p?.active ?? true} /> Visible on site</label>
      </section>
    </ActionForm>
  );
}
