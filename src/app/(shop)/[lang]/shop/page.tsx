import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShopView from "@/components/views/ShopView";
import { isLang } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: "Pakistani Dresses: Lawn, Chiffon, Bridal & Unstitched",
    description: "Browse all Pakistani dresses online. Filter by size, price and type. Worldwide delivery.",
    alternates: alternatesFor(lang, "/shop"),
  };
}

export default async function Shop({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <ShopView lang={lang} demo={false} />;
}
