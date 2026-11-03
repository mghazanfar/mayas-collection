import { notFound } from "next/navigation";
import ActionForm from "@/components/admin/ActionForm";
import ProductForm, { type ProductRow } from "@/components/admin/ProductForm";
import { getDb } from "@/lib/supabase";
import { deleteProduct, updateProduct } from "../../../actions";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  if (!db || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: p }, { data: brands }] = await Promise.all([
    db.from("products").select("*").eq("id", id).maybeSingle(),
    db.from("brands").select("id, name").order("name"),
  ]);
  if (!p) notFound();

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Edit: {p.name}</h1>
      <ProductForm action={updateProduct} brands={brands ?? []} p={p as ProductRow} submitLabel="Save changes" />
      <ActionForm action={deleteProduct} submitLabel="Delete product" danger confirm={`Delete "${p.name}"? Past orders keep their own copy of the details.`} className="mt-10 border-t border-neutral-200 pt-6">
        <input type="hidden" name="id" value={p.id} />
      </ActionForm>
    </>
  );
}
