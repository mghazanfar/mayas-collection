export const SITE_NAME = "Maya's Collection";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://maayascollection.netlify.app"
).replace(/\/$/, "");

export function pkr(n: number): string {
  return `PKR ${n.toLocaleString("en-PK")}`;
}
