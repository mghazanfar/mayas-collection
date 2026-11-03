import "server-only";
import { createCipheriv } from "node:crypto";
import type { Provider } from "./types";

// Easypaisa Easypay hosted checkout ("Checkout Revamp Integration Guide" v6.1, no RSA signature) plus
// the REST "Inquire Transaction Status" API ("REST APIs without RSA Encryption") to verify every payment.
//   EASYPAISA_STORE_ID      store id from the merchant portal
//   EASYPAISA_HASH_KEY      hash key from the merchant portal (16 characters)
//   EASYPAISA_CREDENTIALS   "username:password" for the REST API (Easypaisa provides these)
//   EASYPAISA_ACCOUNT_NUM   merchant EWP account number (Profile page of the merchant portal)
//   EASYPAISA_ENV           "production" for live; anything else = staging
// The production inquiry URL is the staging one with the production host; the guide only lists staging.
const prod = () => process.env.EASYPAISA_ENV === "production";
const HOST = () => (prod() ? "https://easypay.easypaisa.com.pk" : "https://easypaystg.easypaisa.com.pk");

// Pakistan time (UTC+5)
const pk = (d: Date) => new Date(d.getTime() + 5 * 3600_000).toISOString();
const compact = (d: Date) => pk(d).replace(/\D/g, "").slice(0, 14); // yyyymmddHHmmss
const enc = encodeURIComponent;

// AES-128-ECB (PKCS5/7 padding) of "k=v&k=v..." with keys in alphabetical order, base64.
function hashRequest(fields: Record<string, string>, key: string) {
  const text = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join("&");
  const c = createCipheriv("aes-128-ecb", Buffer.from(key, "utf8"), null);
  return Buffer.concat([c.update(text, "utf8"), c.final()]).toString("base64");
}

export const easypaisa: Provider = {
  id: "easypaisa",
  label: "Easypaisa (wallet / card)",
  configured: () =>
    !!process.env.EASYPAISA_STORE_ID &&
    (process.env.EASYPAISA_HASH_KEY ?? "").length === 16 &&
    (process.env.EASYPAISA_CREDENTIALS ?? "").includes(":") &&
    !!process.env.EASYPAISA_ACCOUNT_NUM,

  async start(i) {
    const now = new Date();
    const reference = i.orderNumber.replace(/[^A-Za-z0-9]/g, "");
    const amount = `${i.amount}.0`;
    const expiry = `${compact(new Date(now.getTime() + 3 * 3600_000)).slice(0, 8)} ${compact(new Date(now.getTime() + 3 * 3600_000)).slice(8)}`; // "yyyymmdd HHmmss"
    const timeStamp = pk(now).slice(0, 19); // 2020-07-15T18:03:00
    const mobile = i.phone.match(/^\+92(3\d{9})$/)?.[1];

    // The hash uses the guide's field names (section 4); the URL uses the Step 1 names. Values must match.
    const hashed: Record<string, string> = {
      amount,
      emailAddress: i.email,
      expiryDate: expiry,
      orderRefNum: reference,
      paymentMethod: "InitialRequest",
      postBackURL: i.returnUrl,
      storeId: process.env.EASYPAISA_STORE_ID!,
      timeStamp,
    };
    if (mobile) hashed.mobileNum = `0${mobile}`;
    const encryptedHashRequest = hashRequest(hashed, process.env.EASYPAISA_HASH_KEY!);

    const q: Record<string, string> = {
      storeId: hashed.storeId,
      orderId: reference,
      transactionAmount: amount,
      emailAddress: i.email,
      transactionType: "InitialRequest",
      tokenExpiry: expiry,
      postBackURL: i.returnUrl,
      timeStamp,
      encryptedHashRequest,
    };
    if (mobile) q.mobileAccountNo = `0${mobile}`;
    const url = `${HOST()}/tpg/?${Object.entries(q).map(([k, v]) => `${k}=${enc(v)}`).join("&")}`;
    return { reference, go: { kind: "redirect", url } };
  },

  async parseReturn(req) {
    const u = new URL(req.url);
    const f: Record<string, string> = {};
    u.searchParams.forEach((v, k) => (f[k] = v));
    if (req.method === "POST") (await req.formData().catch(() => null))?.forEach((v, k) => { if (typeof v === "string") f[k] = v; });
    const reference = f.orderRefNumber ?? f.orderRefNum;
    if (!reference) return null;

    // The postback is not signed, so it only says WHICH order to look at. The real answer comes from Easypaisa's API.
    const res = await fetch(`${HOST()}/easypay-service/rest/v4/inquire-transaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Credentials: Buffer.from(process.env.EASYPAISA_CREDENTIALS!).toString("base64") },
      body: JSON.stringify({ orderId: reference, storeId: process.env.EASYPAISA_STORE_ID, accountNum: process.env.EASYPAISA_ACCOUNT_NUM }),
    }).catch(() => null);
    const json = (await res?.json().catch(() => null)) as { responseCode?: string; transactionStatus?: string; transactionAmount?: number } | null;
    if (!json || json.responseCode !== "0000") return { reference, status: "review" };
    const amount = typeof json.transactionAmount === "number" ? json.transactionAmount : undefined;
    const st = (json.transactionStatus ?? "").toUpperCase();
    if (st === "PAID") return { reference, status: "paid", amount };
    if (["FAILED", "EXPIRED", "BLOCKED", "REVERSED"].includes(st)) return { reference, status: "failed" };
    return { reference, status: "review" }; // PENDING etc.: let a human look
  },
};
