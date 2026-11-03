import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CartPage from "@/components/CartPage";
import { isLang } from "@/lib/i18n";
import { ts } from "@/lib/i18n-shop";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function Cart({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">{ts[lang].cartTitle}</h1>
      <CartPage lang={lang} />
    </>
  );
}
