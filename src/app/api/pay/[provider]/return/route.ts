import { NextResponse } from "next/server";
import { getProvider, settlePayment } from "@/lib/payments";
import { LANGS, href, isLang } from "@/lib/i18n";
import { SITE_URL } from "@/lib/site";

// The customer lands here after the gateway (GET or POST depending on the gateway).
// Nothing in the request is trusted until the provider adapter has verified it.
async function handle(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const langQ = new URL(req.url).searchParams.get("lang") ?? "en";
  const lang = isLang(langQ) ? langQ : LANGS[0];
  const p = getProvider(provider);
  const go = (path: string) => NextResponse.redirect(new URL(path, SITE_URL), 303);
  if (!p) return go(href(lang, "/checkout"));

  const verdict = await p.parseReturn(req).catch(() => null);
  if (!verdict) return go(href(lang, "/checkout")); // cancelled
  const res = await settlePayment(p.id, verdict).catch((e) => { console.error("[pay] settle failed", e); return null; });
  if (!res) return go(href(lang, "/checkout"));
  return go(`${href(lang, "/checkout/result")}?order=${encodeURIComponent(res.number)}`);
}

export { handle as GET, handle as POST };
