import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HomeView from "@/components/views/HomeView";
import { isLang } from "@/lib/i18n";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { alternates: alternatesFor(lang, "/") };
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <HomeView lang={lang} demo={false} />;
}
