import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Provider } from "./types";

// JazzCash "Page Redirection" (HTTP POST) checkout. Written from JazzCash's integration guide as
// recalled, NOT yet run against their sandbox: test there before taking real money.
//   JAZZCASH_MERCHANT_ID, JAZZCASH_PASSWORD, JAZZCASH_INTEGRITY_SALT
//   JAZZCASH_ENV  "production" for live; anything else = sandbox
const prod = () => process.env.JAZZCASH_ENV === "production";
const URL_ = () =>
  prod()
    ? "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
    : "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

// Pakistan time (UTC+5) as yyyyMMddHHmmss
const stamp = (d: Date) => new Date(d.getTime() + 5 * 3600_000).toISOString().replace(/\D/g, "").slice(0, 14);

// HMAC-SHA256 over  salt & every non-empty pp_* value, ordered by field name; upper-case hex.
function hash(fields: Record<string, string>, salt: string) {
  const parts = Object.keys(fields)
    .filter((k) => k !== "pp_SecureHash" && k.startsWith("pp") && fields[k] !== "")
    .sort()
    .map((k) => fields[k]);
  return createHmac("sha256", salt).update([salt, ...parts].join("&")).digest("hex").toUpperCase();
}

export const jazzcash: Provider = {
  id: "jazzcash",
  label: "JazzCash (wallet / card)",
  configured: () => !!process.env.JAZZCASH_MERCHANT_ID && !!process.env.JAZZCASH_PASSWORD && !!process.env.JAZZCASH_INTEGRITY_SALT,

  async start(i) {
    const now = new Date();
    const reference = `T${stamp(now)}${Math.floor(Math.random() * 900 + 100)}`;
    const fields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID!,
      pp_SubMerchantID: "",
      pp_Password: process.env.JAZZCASH_PASSWORD!,
      pp_BankID: "TBANK",
      pp_ProductID: "RETL",
      pp_TxnRefNo: reference,
      pp_Amount: String(i.amount * 100), // paisa
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: stamp(now),
      pp_BillReference: i.orderNumber.replace(/[^A-Za-z0-9]/g, ""),
      pp_Description: "Maya's Collection order",
      pp_TxnExpiryDateTime: stamp(new Date(now.getTime() + 3 * 3600_000)),
      pp_ReturnURL: i.returnUrl,
      ppmpf_1: "", ppmpf_2: "", ppmpf_3: "", ppmpf_4: "", ppmpf_5: "",
    };
    fields.pp_SecureHash = hash(fields, process.env.JAZZCASH_INTEGRITY_SALT!);
    return { reference, go: { kind: "post", url: URL_(), fields } };
  },

  async parseReturn(req) {
    if (req.method !== "POST") return null;
    const form = await req.formData().catch(() => null);
    if (!form) return null;
    const f: Record<string, string> = {};
    form.forEach((v, k) => { if (typeof v === "string") f[k] = v; });
    const reference = f.pp_TxnRefNo;
    if (!reference) return null;

    const salt = process.env.JAZZCASH_INTEGRITY_SALT;
    const got = (f.pp_SecureHash ?? "").toUpperCase();
    const want = salt ? hash(f, salt) : "";
    const genuine = want.length > 0 && got.length === want.length && timingSafeEqual(Buffer.from(got), Buffer.from(want));
    if (!genuine) return { reference, status: "review" }; // unsigned or altered: never trust it
    const amount = f.pp_Amount && /^\d+$/.test(f.pp_Amount) ? Number(f.pp_Amount) / 100 : undefined;
    return { reference, status: f.pp_ResponseCode === "000" ? "paid" : "failed", amount };
  },
};
