"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

// The cart is kept while the customer is at the gateway, and cleared only once payment is confirmed.
export default function ClearCartWhenPaid() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
