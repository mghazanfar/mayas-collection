import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandsView from "@/components/views/BrandsView";
import { isLang } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: "Pakistani Dress Brands",
    description: "Shop new collections from top Pakistani clothing brands.",
    alternates: alternatesFor(lang, "/brands"),
  };
}

export default async function Brands({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <BrandsView lang={lang} demo={false} />;
}
