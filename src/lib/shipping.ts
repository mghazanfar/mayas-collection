// Pure shipping/fee maths. Used by the server for quotes and for the final order total,
// so what the customer sees and what is stored can never drift apart.

export type Courier = "pakpost" | "tcs" | "leopard";
export type Zone = "lahore" | "pakistan" | "international";

export const COURIER_LABEL: Record<Courier, string> = {
  pakpost: "Pakistan Post",
  tcs: "TCS",
  leopard: "Leopards",
};

export type RateRow = {
  courier: Courier;
  zone: Zone;
  up_to_g: number;
  price: number;
  eta_min_days: number;
  eta_max_days: number;
};

export type FeeSettings = {
  lahore_handling: number;
  other_city_handling: number;
  international_handling: number;
  cod_fee: number;
  gateway_fee_pct: number;
};

export type OnlineMethod = "safepay" | "jazzcash" | "easypaisa";
export type PaymentMethod = "cod" | "bank_transfer" | OnlineMethod;
export const ONLINE_METHODS: readonly OnlineMethod[] = ["safepay", "jazzcash", "easypaisa"];
export const isOnline = (m: string): m is OnlineMethod => (ONLINE_METHODS as readonly string[]).includes(m);

export type ShippingOption = {
  courier: Courier;
  label: string;
  courierPrice: number;
  handling: number;
  fee: number; // what the customer pays for delivery: courier charge + handling
  etaMin: number;
  etaMax: number;
};

export const COUNTRIES = [
  "Pakistan", "United Arab Emirates", "Saudi Arabia", "United Kingdom", "United States", "Canada", "Australia",
  "Qatar", "Kuwait", "Oman", "Bahrain", "Germany", "France", "Italy", "Spain", "Netherlands", "Ireland", "Sweden",
  "Norway", "Denmark", "Turkey", "Malaysia", "Singapore", "New Zealand", "South Africa", "Other",
] as const;

export function zoneFor(country: string, city: string): Zone {
  if (country !== "Pakistan") return "international";
  return city.trim().toLowerCase() === "lahore" ? "lahore" : "pakistan";
}

const handlingFor = (zone: Zone, s: FeeSettings) =>
  zone === "lahore" ? s.lahore_handling : zone === "pakistan" ? s.other_city_handling : s.international_handling;

// Cheapest slab that fits the parcel weight, per courier. A courier with no slab big
// enough (or no rate for that zone) is simply not offered.
export function shippingOptions(rates: RateRow[], zone: Zone, weightG: number, s: FeeSettings): ShippingOption[] {
  const out: ShippingOption[] = [];
  for (const courier of ["pakpost", "tcs", "leopard"] as const) {
    const slab = rates
      .filter((r) => r.courier === courier && r.zone === zone && r.up_to_g >= weightG)
      .sort((a, b) => a.up_to_g - b.up_to_g)[0];
    if (!slab) continue;
    const handling = handlingFor(zone, s);
    out.push({
      courier,
      label: COURIER_LABEL[courier],
      courierPrice: slab.price,
      handling,
      fee: slab.price + handling,
      etaMin: slab.eta_min_days,
      etaMax: slab.eta_max_days,
    });
  }
  return out;
}

export function allowedPayments(zone: Zone): PaymentMethod[] {
  // Cash on delivery only exists inside Pakistan.
  // JazzCash and Easypaisa are Pakistani wallets; Safepay is the one offered for cards from abroad.
  return zone === "international" ? ["bank_transfer", "safepay"] : ["cod", "bank_transfer", "safepay", "jazzcash", "easypaisa"];
}

export function orderTotals(subtotal: number, shippingFee: number, method: PaymentMethod, s: FeeSettings) {
  const codFee = method === "cod" ? s.cod_fee : 0;
  // Gateway fee only applies to online payments, charged on goods + delivery.
  const gatewayFee = isOnline(method) ? Math.ceil(((subtotal + shippingFee) * s.gateway_fee_pct) / 100) : 0;
  return { codFee, gatewayFee, total: subtotal + shippingFee + codFee + gatewayFee };
}

// Example price list used ONLY for demo carts, so the flow can be tried before real rates exist.
// These are made-up numbers, not courier prices.
export const DEMO_RATES: RateRow[] = (["lahore", "pakistan", "international"] as const).flatMap((zone) =>
  (["pakpost", "tcs", "leopard"] as const).map((courier) => ({
    courier,
    zone,
    up_to_g: 5000,
    price: ({ lahore: 150, pakistan: 300, international: 3000 })[zone] + (courier === "pakpost" ? 0 : 200),
    eta_min_days: zone === "international" ? 10 : courier === "pakpost" ? 4 : 2,
    eta_max_days: zone === "international" ? 21 : courier === "pakpost" ? 8 : 4,
  })),
);
