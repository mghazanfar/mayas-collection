import ProductForm from "@/components/admin/ProductForm";
import { getDb } from "@/lib/supabase";
import { createProduct } from "../../../actions";

export default async function NewProduct() {
  const db = getDb();
  const { data } = db ? await db.from("brands").select("id, name").order("name") : { data: [] };
  const brands = data ?? [];
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Add product</h1>
      {brands.length === 0 ? <p className="text-neutral-600">Add a brand first (Brands page).</p> : <ProductForm action={createProduct} brands={brands} submitLabel="Create product" />}
    </>
  );
}
