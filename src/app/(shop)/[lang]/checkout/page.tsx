import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/CheckoutForm";
import { isLang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function Checkout({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{ts[lang].checkout}</h1>
      <CheckoutForm lang={lang} />
    </>
  );
}
