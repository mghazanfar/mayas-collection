import { notFound } from "next/navigation";
import BrandsView from "@/components/views/BrandsView";
import { isLang } from "@/lib/i18n";

export default async function DemoBrands({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <BrandsView lang={lang} demo />;
}
