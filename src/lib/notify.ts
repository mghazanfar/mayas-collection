import "server-only";

// New-order alerts. Both channels are optional and fail soft: an outage at the email or
// WhatsApp provider must never stop a customer from placing an order.
//
// Email    : Resend (https://resend.com)       -> RESEND_API_KEY, MAIL_FROM
// WhatsApp : Meta WhatsApp Cloud API           -> WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEMPLATE
// The WhatsApp template must be approved in Meta Business Manager and take 3 body
// variables: {{1}} order number, {{2}} total (PKR), {{3}} city.

export type OrderSummary = {
  number: string;
  total: number;
  city: string;
  country: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentMethod: string;
  itemsText: string;
};

async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) return console.warn("[notify] email skipped: RESEND_API_KEY / MAIL_FROM not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) console.error("[notify] email failed", res.status, await res.text().catch(() => ""));
}

async function sendWhatsApp(to: string, o: OrderSummary) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const template = process.env.WHATSAPP_TEMPLATE;
  if (!token || !phoneId || !template) return console.warn("[notify] whatsapp skipped: env not set");
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/^\+/, ""),
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: [{ type: "body", parameters: [o.number, `PKR ${o.total.toLocaleString("en-PK")}`, o.city].map((text) => ({ type: "text", text })) }],
      },
    }),
  });
  if (!res.ok) console.error("[notify] whatsapp failed", res.status, await res.text().catch(() => ""));
}

export async function notifyNewOrder(o: OrderSummary, ownerEmail: string, ownerWhatsapp: string) {
  const owner = `New order ${o.number}\nTotal: PKR ${o.total.toLocaleString("en-PK")}\nPayment: ${o.paymentMethod}\nCustomer: ${o.customerName} (${o.customerPhone}, ${o.customerEmail})\nShip to: ${o.city}, ${o.country}\n\n${o.itemsText}`;
  const customer = `Thank you for your order, ${o.customerName}!\n\nOrder ${o.number}\nTotal: PKR ${o.total.toLocaleString("en-PK")}\n\n${o.itemsText}\n\nYou can track it any time on our site with your order number and this email address.`;
  await Promise.allSettled([
    ownerEmail && sendEmail(ownerEmail, `New order ${o.number}`, owner),
    sendEmail(o.customerEmail, `Your order ${o.number}`, customer),
    ownerWhatsapp && sendWhatsApp(ownerWhatsapp, o),
    sendWhatsApp(o.customerPhone, o),
  ]);
}
