import "server-only";
import { headers } from "next/headers";

// Per-instance, in-memory limiter. On serverless each instance keeps its own counters, so
// this blunts casual abuse (form spam, enumeration) but isn't a hard guarantee.
const hits = new Map<string, number[]>();

export async function tooMany(bucket: string, max: number, windowMs: number): Promise<boolean> {
  const h = await headers();
  const ip = h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}
