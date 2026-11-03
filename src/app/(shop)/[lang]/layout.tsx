import type { Metadata } from "next";
import { Geist, Noto_Nastaliq_Urdu } from "next/font/google";
import { notFound } from "next/navigation";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CartProvider } from "@/lib/cart";
import { getAnnouncement } from "@/lib/settings";
import { isLiveCatalogEmpty } from "@/lib/catalog";
import { DIR, HTML_LANG, LANGS, isLang } from "@/lib/i18n";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "../../globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const nastaliq = Noto_Nastaliq_Urdu({ variable: "--font-nastaliq", subsets: ["arabic"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Pakistani Dresses Online, Shipped Worldwide`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Buy authentic Pakistani dresses online: lawn, chiffon, bridal and unstitched suits from top Pakistani brands, delivered worldwide.",
};

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const [liveEmpty, announcement] = await Promise.all([isLiveCatalogEmpty(), getAnnouncement()]);

  return (
    <html
      lang={HTML_LANG[lang]}
      dir={DIR[lang]}
      className={`${geist.variable} ${nastaliq.variable} ${lang === "ur" ? "font-urdu" : ""}`}
    >
      <body className="min-h-screen bg-white text-neutral-900 antialiased">
        <CartProvider>
          <Header lang={lang} liveEmpty={liveEmpty} announcement={announcement} />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <Footer lang={lang} />
          <CartDrawer lang={lang} />
        </CartProvider>
      </body>
    </html>
  );
}
