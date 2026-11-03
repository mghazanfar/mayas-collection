import type { OnlineMethod } from "@/lib/shipping";

export type StartInput = {
  reference: string; // our unique id for this attempt; stored in `payments` and matched on return
  orderNumber: string;
  amount: number; // whole PKR
  email: string;
  phone: string;
  name: string;
  returnUrl: string;
  cancelUrl: string;
};

// What the browser must do to reach the gateway: follow a link, or POST a form.
export type StartResult =
  | { kind: "redirect"; url: string }
  | { kind: "post"; url: string; fields: Record<string, string> };

export type Verdict = {
  reference: string; // matched against payments.reference
  status: "paid" | "failed" | "review"; // review = the gateway's reply could not be verified
  amount?: number; // whole PKR, when the gateway echoes it
};

export type Provider = {
  id: OnlineMethod;
  label: string;
  configured(): boolean;
  // Returns the reference to store (it may be chosen by the gateway) plus where to send the customer.
  start(i: StartInput): Promise<{ reference: string; go: StartResult }>;
  // Reads the customer's return from the gateway. null = cancelled / unreadable.
  parseReturn(req: Request): Promise<Verdict | null>;
};
