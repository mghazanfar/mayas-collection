import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TrackForm from "@/components/TrackForm";
import { isLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";
import { alternatesFor } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return { title: "Returns & refunds", alternates: alternatesFor(lang, "/returns") };
}

export default async function Returns({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const s = await getSettings().catch(() => null);
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Returns & refunds</h1>
      <ol className="mb-8 max-w-2xl list-decimal space-y-1 ps-5 text-sm text-neutral-700">
        <li>Find your order below and tell us what is wrong.</li>
        <li>Post the item to our return address (shown after you submit).</li>
        <li>We check the item. If the issue is valid, you are refunded.</li>
        <li>If we can&apos;t confirm the issue, we will call you to discuss a resolution.</li>
      </ol>
      <TrackForm mode="return" returnAddress={s?.return_address ?? ""} />
    </>
  );
}
