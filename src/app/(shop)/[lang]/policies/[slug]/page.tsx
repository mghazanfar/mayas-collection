import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLang } from "@/lib/i18n";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

const TITLES: Record<string, string> = {
  shipping: "Shipping policy",
  returns: "Return & refund policy",
  privacy: "Privacy policy",
  terms: "Terms of service",
};

export function generateStaticParams() {
  return Object.keys(TITLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: TITLES[slug] ?? "Policy" };
}

// Starting-point wording for a small online dress shop. Have it checked by a lawyer
// (especially the privacy policy for UK/EU customers) before relying on it.
export default async function Policy({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang) || !TITLES[slug]) notFound();
  const s = await getSettings().catch(() => null);
  const contact = s?.owner_email || "our contact email";
  const retAddr = s?.return_address || "the return address shown on the Returns page";
  const ntn = s?.ntn ? ` (NTN ${s.ntn})` : "";

  const body: Record<string, string[]> = {
    shipping: [
      "We ship from Lahore, Pakistan with Pakistan Post, TCS or Leopards. You choose the courier at checkout, and the delivery charge and estimated delivery time are shown before you pay.",
      "Orders are dispatched within 1–2 working days. Delivery times are estimates from dispatch; couriers can be delayed by weather, holidays, customs or other events outside our control.",
      "International orders may be subject to import duties, taxes or customs fees charged by your country. These are the buyer's responsibility and are not included in our prices.",
      "Cash on delivery is available inside Pakistan only and carries an extra fee shown at checkout.",
    ],
    returns: [
      "If something is wrong with your order (wrong item, damage, or a defect), open the Returns page, enter your order number and email, and describe the problem.",
      `Post the item to: ${retAddr}. Keep your courier receipt until we confirm that we received it.`,
      "When we receive the item we inspect it. If the issue is valid you are refunded; if it isn't, we will call you to discuss a resolution.",
      "Items must be unused and in their original condition. Customised or altered items can't be returned unless faulty.",
    ],
    privacy: [
      `We collect the details you give at checkout (name, email, phone, delivery address) to process and deliver your order, to contact you about it, and to handle returns. The business is operated by ${"Maya's Collection"}${ntn}.`,
      "We share your name, address and phone number with the courier that delivers your order, and with the email and messaging providers that send your order confirmations. We do not sell your data.",
      "We keep order records for as long as needed for accounting and legal obligations.",
      `To ask for a copy of your data, a correction or deletion, email ${contact}.`,
      "The site stores your cart in your browser (local storage) so it is still there when you return. We do not use advertising trackers.",
    ],
    terms: [
      `Maya's Collection${ntn} sells Pakistani dresses online. By placing an order you confirm the details you gave are correct and that you accept these terms.`,
      "Prices are in Pakistani rupees (PKR). Prices shown in other currencies are estimates. Colours may look slightly different on your screen.",
      "An order is accepted when we dispatch it. We may cancel an order (with a full refund of anything paid) if an item is unavailable or a price was shown incorrectly.",
      `Questions? Email ${contact}.`,
    ],
  };

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">{TITLES[slug]}</h1>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-700">{body[slug].map((p, i) => <p key={i}>{p}</p>)}</div>
    </article>
  );
}
