import { notFound } from "next/navigation";
import BrandView from "@/components/views/BrandView";
import { isLang } from "@/lib/i18n";

export default async function DemoBrand({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  return <BrandView lang={lang} slug={slug} demo />;
}
