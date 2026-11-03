import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackForm from "@/components/TrackForm";
import { isLang } from "@/lib/i18n";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

export default async function Track({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Track your order</h1>
      <p className="mb-6 text-sm text-neutral-600">Enter your order number and the email you used. No account needed.</p>
      <TrackForm mode="track" />
    </>
  );
}
