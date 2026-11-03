import { notFound } from "next/navigation";
import ShopView from "@/components/views/ShopView";
import { isLang } from "@/lib/i18n";

export default async function DemoSearch({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <ShopView lang={lang} demo search />;
}
