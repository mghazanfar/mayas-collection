import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopView from "@/components/views/ShopView";
import { isLang } from "@/lib/i18n";

export const revalidate = 300;

// Search results are thin, duplicate content: keep them out of Google.
export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function Search({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <ShopView lang={lang} demo={false} search />;
}
