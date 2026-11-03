import type { Metadata } from "next";

// Demo pages must never be indexed or followed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
