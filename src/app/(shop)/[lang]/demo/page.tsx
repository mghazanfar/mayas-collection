import { notFound } from "next/navigation";
import HomeView from "@/components/views/HomeView";
import { isLang } from "@/lib/i18n";

export default async function DemoHome({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <HomeView lang={lang} demo />;
}
