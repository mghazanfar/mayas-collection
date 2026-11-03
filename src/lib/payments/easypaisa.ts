import "server-only";
import { createCipheriv } from "node:crypto";
import type { Provider } from "./types";

// Easypaisa "Easypay" hosted checkout. Written from Easypaisa's integration guide as recalled,
// NOT yet run against their sandbox. Their return is not signed in a way we can verify here, so a
// successful return is marked "review": the owner confirms it in the Easypaisa merchant portal and
// then sets the order to Paid in the admin. Failed returns are marked failed.
//   EASYPAISA_STORE_ID, EASYPAISA_HASH_KEY (16 characters)
//   EASYPAISA_ENV  "production" for live; anything else = sandbox
const prod = () => process.env.EASYPAISA_ENV === "production";
const URL_ = () => (prod() ? "https://easypay.easypaisa.com.pk/easypay/Index.jsf" : "https://easypaystg.easypaisa.com.pk/easypay/Index.jsf");

function hashReq(fields: Record<string, string>, key: string) {
  const text = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join("&");
  const c = createCipheriv("aes-128-ecb", Buffer.from(key, "utf8"), null);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("base64");
}

export const easypaisa: Provider = {
  id: "easypaisa",
  label: "Easypaisa (wallet / card)",
  configured: () => !!process.env.EASYPAISA_STORE_ID && (process.env.EASYPAISA_HASH_KEY ?? "").length === 16,

  async start(i) {
    const reference = i.orderNumber.replace(/[^A-Za-z0-9]/g, "");
    const fields: Record<string, string> = {
      amount: `${i.amount}.0`,
      autoRedirect: "1",
      emailAddr: i.email,
      orderRefNum: reference,
      postBackURL: i.returnUrl,
      storeId: process.env.EASYPAISA_STORE_ID!,
    };
    const m = i.phone.match(/^\+92(3\d{9})$/);
    if (m) fields.mobileNum = `0${m[1]}`;
    fields.merchantHashedReq = hashReq(fields, process.env.EASYPAISA_HASH_KEY!);
    return { reference, go: { kind: "post", url: URL_(), fields } };
  },

  async parseReturn(req) {
    const u = new URL(req.url);
    const f: Record<string, string> = {};
    u.searchParams.forEach((v, k) => (f[k] = v));
    if (req.method === "POST") (await req.formData().catch(() => null))?.forEach((v, k) => { if (typeof v === "string") f[k] = v; });
    const reference = f.orderRefNumber ?? f.orderRefNum;
    if (!reference) return null;
    if (f.success === "false" || f.status === "FAILED") return { reference, status: "failed" };
    return f.success === "true" || f.status === "PAID" ? { reference, status: "review" } : null;
  },
};
