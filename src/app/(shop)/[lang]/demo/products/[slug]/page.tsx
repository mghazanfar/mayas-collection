import { notFound } from "next/navigation";
import ProductView from "@/components/views/ProductView";
import { isLang } from "@/lib/i18n";

export default async function DemoProduct({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  return <ProductView lang={lang} slug={slug} demo />;
}
